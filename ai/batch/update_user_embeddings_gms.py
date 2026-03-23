import os
import pymysql
from neo4j import GraphDatabase
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

GMS_API_KEY = os.getenv("GMS_API_KEY")
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3307"))
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASS = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7688")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASSWORD")

for var_name, var_val in [("GMS_API_KEY", GMS_API_KEY), ("MYSQL_USER", MYSQL_USER), ("MYSQL_PASSWORD", MYSQL_PASS), ("MYSQL_DB", MYSQL_DB), ("NEO4J_PASSWORD", NEO4J_PASS)]:
    if not var_val:
        raise ValueError(f"{var_name} 환경변수가 설정되지 않았습니다.")

# GMS API Client Init (SSAFY Gateway format)
client = OpenAI(
    api_key=GMS_API_KEY,
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
)

EXPERIENCE_MAP = {
    'BEGINNER': '신입',
    'JUNIOR': '주니어',
    'SENIOR': '시니어',
}

GOAL_MAP = {
    'SIDE_PROJECT': '사이드 프로젝트',
    'STARTUP': '창업',
    'EMPLOYMENT': '취업',
    'FREELANCER': '프리랜서',
}

TENDENCY_MAP = {
    'LEADER': '리더형',
    'FOLLOWER': '팔로워형',
    'PLANNER': '기획형',
    'EXECUTOR': '실행형',
}


def get_user_profiles():
    conn = pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT,
        user=MYSQL_USER, password=MYSQL_PASS,
        database=MYSQL_DB, charset='utf8mb4'
    )
    cursor = conn.cursor()
    query = """
        SELECT
            u.user_id,
            u.description,
            u.experience,
            u.team_tendency,
            u.mbti,
            GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills,
            GROUP_CONCAT(DISTINCT ug.goal ORDER BY ug.goal SEPARATOR ', ') AS goals,
            GROUP_CONCAT(DISTINCT ur.role ORDER BY ur.role SEPARATOR ', ') AS roles,
            GROUP_CONCAT(p.readme ORDER BY p.created_at DESC SEPARATOR '\n\n---\n\n') AS readme
        FROM users u
        LEFT JOIN user_skill us ON u.user_id = us.user_id
        LEFT JOIN skill s ON us.skill_id = s.skill_id
        LEFT JOIN user_goals ug ON u.user_id = ug.user_id
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN projects p ON p.leader_id = u.user_id
            AND p.readme IS NOT NULL AND p.readme != ''
        GROUP BY u.user_id
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return results


def build_embedding_text(user_id, description, experience, tendency, mbti, skills, goals, roles, readme):
    # 프로필 텍스트 (항상 생성)
    profile_parts = []
    if roles:
        profile_parts.append(f"직무: {roles}")
    if experience:
        profile_parts.append(f"경험 수준: {EXPERIENCE_MAP.get(experience, experience)}")
    if skills:
        profile_parts.append(f"보유 스킬: {skills}")
    if goals:
        mapped = ', '.join(GOAL_MAP.get(g.strip(), g.strip()) for g in goals.split(','))
        profile_parts.append(f"목표: {mapped}")
    if tendency:
        profile_parts.append(f"팀 성향: {TENDENCY_MAP.get(tendency, tendency)}")
    if mbti:
        profile_parts.append(f"MBTI: {mbti}")
    if description and description.strip():
        profile_parts.append(f"자기소개: {description.strip()}")

    profile_text = '\n'.join(profile_parts)

    # README 있으면 README + 프로필 결합, 없으면 프로필만
    if readme and readme.strip():
        return f"{readme.strip()}\n\n---\n{profile_text}" if profile_text else readme.strip()

    return profile_text if profile_text else None


def generate_embedding(text):
    if not text or text.strip() == "":
        return None
    try:
        response = client.embeddings.create(
            input=text[:8000],
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding API Error: {e}")
        return None


def update_neo4j_embeddings(user_embeddings):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

    def _update(tx, user_id, embedding):
        query = """
        MERGE (u:User {id: $user_id})
        SET u.embedding = $embedding
        RETURN u.id
        """
        return tx.run(query, user_id=user_id, embedding=embedding).single()

    with driver.session() as session:
        success_count = 0
        for user_id, emb in user_embeddings:
            if emb:
                result = session.execute_write(_update, int(user_id), emb)
                if result:
                    success_count += 1
                else:
                    print(f"Neo4j에 User {user_id} 노드가 없습니다. (건너뜀)")
        print(f"[성공] 총 {success_count}명의 유저 임베딩이 업데이트 되었습니다.")
    driver.close()


if __name__ == "__main__":
    print("1. MySQL에서 유저 프로필 추출 중...")
    profiles = get_user_profiles()
    print(f"   -> 총 {len(profiles)}명 조회 완료\n")

    readme_count = sum(1 for row in profiles if row[8] and row[8].strip())
    print(f"   소스 분류: README+프로필 {readme_count}명 / 프로필 텍스트만 {len(profiles) - readme_count}명\n")

    user_embeddings = []
    print("2. GMS를 통해 임베딩 벡터 생성 중...")
    for idx, (user_id, description, experience, tendency, mbti, skills, goals, roles, readme) in enumerate(profiles, 1):
        text = build_embedding_text(user_id, description, experience, tendency, mbti, skills, goals, roles, readme)
        if not text:
            print(f"   [건너뜀] User {user_id} - 임베딩 생성 가능한 데이터 없음")
            continue

        source = "README+프로필" if (readme and readme.strip()) else "프로필"
        emb = generate_embedding(text)
        if emb:
            user_embeddings.append((user_id, emb))
            if idx % 10 == 0:
                print(f"   ... {idx}명 처리 완료")
        else:
            print(f"   [실패] User {user_id} ({source}) 임베딩 생성 오류")

    print(f"\n3. Neo4j에 임베딩 벡터 동기화 중... ({len(user_embeddings)}명)")
    try:
        update_neo4j_embeddings(user_embeddings)
        print("\n완료!")
    except Exception as e:
        print(f"Neo4j 연결 및 쿼리 에러 발생: {e}")
