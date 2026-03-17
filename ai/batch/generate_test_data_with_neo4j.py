import random
from neo4j import GraphDatabase

# 설정
NUM_USERS = 50
SKILLS_PER_USER_MIN = 2
SKILLS_PER_USER_MAX = 5
MAX_SKILL_ID = 100 # MySQL에 등록된 스킬이 대략 100개 이상 있다고 가정 (1~100 사이 랜덤)

# 1. SQL 쿼리 생성
sql_lines = []
sql_lines.append("START TRANSACTION;")
sql_lines.append(f"INSERT INTO users (user_name, email, authority, created_at) VALUES")

users_values = []
for i in range(1, NUM_USERS + 1):
    users_values.append(f"('testuser_{i}', 'test_{i}@github.com', 'ROLE_USER', NOW())")

sql_lines.append(",\n".join(users_values) + ";")

sql_lines.append("\n-- User_Skill (랜덤 매핑, 위에서 들어간 users의 ID가 마지막 값들 다음에 이어진다고 가정합니다. 기존 DB의 user_id 시작값에 따라 달라질 수 있습니다.)")
sql_lines.append("-- 여기서는 단순히 새로 추가된 유저가 1번부터 50번이라고 가정하고 덤프를 생성했습니다. 실제 워크벤치 환경에 맞게 user_id를 조정해야 할 수도 있습니다.")

# 임시 매핑 데이터 (Neo4j에도 똑같이 넣기 위해 저장)
user_skills_map = {}
for user_id in range(1, NUM_USERS + 1):
    num_skills = random.randint(SKILLS_PER_USER_MIN, SKILLS_PER_USER_MAX)
    # 중복 없이 스킬 추출
    sampled_skills = random.sample(range(1, MAX_SKILL_ID + 1), num_skills)
    user_skills_map[user_id] = sampled_skills

sql_lines.append("INSERT INTO user_skill (user_id, skill_id, created_at) VALUES")
user_skill_values = []
for user_id, skills in user_skills_map.items():
    for skill_id in skills:
        user_skill_values.append(f"({user_id}, {skill_id}, NOW())")

sql_lines.append(",\n".join(user_skill_values) + ";")
sql_lines.append("COMMIT;")

with open("insert_mock_users_and_skills.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print("✅ 'insert_mock_users_and_skills.sql' 파일이 생성되었습니다.")

# 2. Neo4j 에 덤프 데이터 반영 (동일한 유저들에 대해 더미 임베딩과 스킬 관계 매핑)
URI = "bolt://localhost:7688"
AUTH = ("neo4j", "default-neo4j-password-please-change-in-production")

def inject_to_neo4j():
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session() as session:
            print("🚀 Neo4j에 테스트 유저 및 스킬 관계를 생성합니다...")
            # 1. 기존 테스트 데이터가 있다면 삭제 (1번~50번 유저)
            session.run("MATCH (u:User)-[r]-() WHERE toInteger(u.id) <= 50 DETACH DELETE u")
            session.run("MATCH (u:User) WHERE toInteger(u.id) <= 50 DETACH DELETE u")
            
            for user_id, skills in user_skills_map.items():
                # 더미 임베딩 1536 차원
                query = """
                MERGE (u:User {id: $user_id})
                SET u.embedding = [i IN range(1, 1536) | rand()]
                WITH u
                UNWIND $skills AS skillId
                MATCH (s:Skill {id: skillId})
                MERGE (u)-[:HAS_SKILL]->(s)
                """
                session.run(query, user_id=user_id, skills=skills)
            print("✅ Neo4j 테스트 데이터 입력을 완료했습니다!")

if __name__ == "__main__":
    inject_to_neo4j()
