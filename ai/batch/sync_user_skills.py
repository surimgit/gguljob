import os
import pymysql
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3307"))
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7688")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

for var_name, var_val in [("MYSQL_USER", MYSQL_USER), ("MYSQL_PASSWORD", MYSQL_PASSWORD), ("MYSQL_DB", MYSQL_DB), ("NEO4J_PASSWORD", NEO4J_PASSWORD)]:
    if not var_val:
        raise ValueError(f"{var_name} 환경변수가 설정되지 않았습니다.")

def main():
    # 1. Fetch user_skills from MySQL
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT,
        user=MYSQL_USER, password=MYSQL_PASSWORD,
        database=MYSQL_DB
    )
    user_skills = []
    with mysql_conn.cursor() as cursor:
        cursor.execute("SELECT user_id, skill_id FROM user_skill")
        for row in cursor.fetchall():
            user_skills.append((row[0], row[1]))
    mysql_conn.close()

    print(f"Fetched {len(user_skills)} user_skill records from MySQL.")

    # 2. Insert into Neo4j
    neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    query = """
    UNWIND $pairs AS pair
    MATCH (u:User) WHERE toString(u.id) = toString(pair[0]) OR u.id = pair[0]
    MATCH (s:Skill) WHERE toString(s.id) = toString(pair[1]) OR s.id = pair[1]
    MERGE (u)-[r:HAS_SKILL]->(s)
    RETURN count(r) as processed
    """

    with neo4j_driver.session() as session:
        result = session.run(query, pairs=user_skills)
        processed = result.single()["processed"]
        print(f"Successfully processed {processed} HAS_SKILL relationships in Neo4j.")

    neo4j_driver.close()

if __name__ == "__main__":
    main()
