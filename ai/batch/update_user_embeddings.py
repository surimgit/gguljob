import pymysql
from neo4j import GraphDatabase
import os
from openai import OpenAI

# OpenAI API 키 설정 (아래 문자열에 직접 넣거나 환경변수 세팅)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "여기에_OPENAI_API_키를_넣어주세요")
client = OpenAI(api_key=OPENAI_API_KEY)

# MySQL 설정 (기존 정보 동일)
MYSQL_HOST = '127.0.0.1'
MYSQL_PORT = 3307
MYSQL_USER = 'gguljob_dev_user'
MYSQL_PASS = 'ggulggule107$8991237!'
MYSQL_DB = 'gguljob_dev'

# Neo4j 설정 (사용하시는 Neo4j의 비밀번호로 수정해주세요!)
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PASS = "12341234" # 👈 본인 Neo4j 비밀번호로 꼭 변경하세요

def get_user_readmes():
    conn = pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT, 
        user=MYSQL_USER, password=MYSQL_PASS, 
        database=MYSQL_DB, charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    # 여러 프로젝트를 가진 유저를 위해 리드미 텍스트를 하나로 합침
    query = """
        SELECT leader_id, GROUP_CONCAT(readme SEPARATOR '\n\n---\n\n') as combined_readme
        FROM projects
        WHERE leader_id IS NOT NULL
        GROUP BY leader_id
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return results

def generate_embedding(text):
    if not text or text.strip() == "":
        return None
    
    # 텍스트가 너무 길면 OpenAI 토큰 수 제한 방지를 위해 적절히 커팅
    truncated_text = text[:8000] 
    
    try:
        response = client.embeddings.create(
            input=truncated_text,
            model="text-embedding-3-small" # 1536 차원 최신/가성비 모델
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return None

def update_neo4j_embeddings(user_embeddings):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    
    def _update(tx, user_id, embedding):
        # Neo4j User 노드에 접근해서 embedding 속성을 업데이트 (이전 스크립트 기준 id 속성 사용)
        query = """
        MATCH (u:User {id: $user_id})
        SET u.embedding = $embedding
        RETURN u.id
        """
        result = tx.run(query, user_id=user_id, embedding=embedding)
        return result.single()

    with driver.session() as session:
        success_count = 0
        for user_id, emb in user_embeddings:
            if emb:
                # Spring Boot ID 타입이 Long이므로 int로 캐스팅
                result = session.execute_write(_update, int(user_id), emb)
                if result:
                    success_count += 1
                else:
                    print(f"Neo4j에 User {user_id} 노드가 없는 것 같습니다. (건너뜀)")
                    
        print(f"✅ 총 {success_count}명의 유저 임베딩 벡터가 Neo4j에 업데이트 되었습니다.")
    
    driver.close()

if __name__ == "__main__":
    if OPENAI_API_KEY == "여기에_OPENAI_API_키를_넣어주세요":
        print("🚨 스크립트 상단의 OPENAI_API_KEY 값에 실제 API 키를 입력해주세요!!")
        exit(1)

    print("1. MySQL에서 유저별 프로젝트 리드미 추출 중...")
    user_readmes = get_user_readmes()
    print(f"👉 총 {len(user_readmes)}명의 유저 포트폴리오 데이터를 찾았습니다.\n")

    user_embeddings = []
    print("2. OpenAI로 임베딩 벡터 생성 중... (API 호출 대기)")
    for idx, (leader_id, readme_text) in enumerate(user_readmes, 1):
        emb = generate_embedding(readme_text)
        if emb:
            user_embeddings.append((leader_id, emb))
            if idx % 10 == 0:
                print(f"   ... {idx}명 완료")
                
    print("\n3. Neo4j에 임베딩 벡터 동기화 중...")
    try:
        update_neo4j_embeddings(user_embeddings)
        print("\n🎉 모든 동기화 작업이 성공적으로 끝났습니다! 이제 백엔드 API에서 추천 결과를 확인해보세요.")
    except Exception as e:
        print(f"Neo4j 연결 및 쿼리 에러 발생: {e}")
        print("Neo4j 비밀번호(NEO4J_PASS)가 맞는지 확인해주세요!")
