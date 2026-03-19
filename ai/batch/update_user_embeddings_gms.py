import pymysql
from neo4j import GraphDatabase
import os
import requests
from openai import OpenAI

def parse_env_file(file_path):
    env_vars = {}
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

# Load .env vars
env_vars = parse_env_file('.env')
GMS_API_KEY = env_vars.get("GMS_API_KEY")
NEO4J_PASS = env_vars.get("NEO4J_PASSWORD", "12341234")

# GMS API Client Init (SSAFY Gateway format)
client = OpenAI(
    api_key=GMS_API_KEY,
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
)

# MySQL settings
MYSQL_HOST = '127.0.0.1'
MYSQL_PORT = 3307
MYSQL_USER = 'gguljob_dev_user'
MYSQL_PASS = 'ggulggule107$8991237!'
MYSQL_DB = 'gguljob_dev'

# Neo4j settings
NEO4J_URI = "bolt://127.0.0.1:7688"
NEO4J_USER = "neo4j"

def get_user_readmes():
    conn = pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT, 
        user=MYSQL_USER, password=MYSQL_PASS, 
        database=MYSQL_DB, charset='utf8mb4'
    )
    cursor = conn.cursor()
    query = """
        SELECT leader_id, GROUP_CONCAT(readme SEPARATOR '\n\n---\n\n') as combined_readme
        FROM projects
        WHERE leader_id IS NOT NULL AND readme IS NOT NULL AND readme != ''
        GROUP BY leader_id
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return results

def generate_embedding(text):
    if not text or text.strip() == "":
        return None
    truncated_text = text[:8000] 
    try:
        response = client.embeddings.create(
            input=truncated_text,
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
        result = tx.run(query, user_id=user_id, embedding=embedding)
        return result.single()

    with driver.session() as session:
        success_count = 0
        for user_id, emb in user_embeddings:
            if emb:
                result = session.execute_write(_update, int(user_id), emb)
                if result:
                    success_count += 1
                else:
                    print(f"Neo4j에 User {user_id} 노드가 없습니다. (건너뜀)")
        print(f"[성공] 총 {success_count}명의 유저 임베딩 벡터가 Neo4j에 업데이트 되었습니다.")
    driver.close()

if __name__ == "__main__":
    print(f"1. MySQL에서 리드미 추출 중...")
    user_readmes = get_user_readmes()
    print(f"-> 총 {len(user_readmes)}명의 유저 포트폴리오 데이터를 찾았습니다.\n")

    user_embeddings = []
    print("2. GMS를 통해 임베딩 벡터 생성 중...")
    for idx, (leader_id, readme_text) in enumerate(user_readmes, 1):
        emb = generate_embedding(readme_text)
        if emb:
            user_embeddings.append((leader_id, emb))
            if idx % 10 == 0:
                print(f"   ... {idx}명 완료")
        else:
            print(f"[실패] User {leader_id} 임베딩 생성 오류")
                
    print("\n3. Neo4j에 임베딩 벡터 동기화 중...")
    try:
        update_neo4j_embeddings(user_embeddings)
        print("\n완료! GMS를 활용한 벡터 마이그레이션이 성공적으로 끝났습니다.")
    except Exception as e:
        print(f"Neo4j 연결 및 쿼리 에러 발생: {e}")

