import pymysql
from neo4j import GraphDatabase

def main():
    # 1. Fetch user_skills from MySQL
    mysql_conn = pymysql.connect(
        host='127.0.0.1', port=3307,
        user='gguljob_dev_user', password='ggulggule107$8991237!',
        database='gguljob_dev'
    )
    user_skills = []
    with mysql_conn.cursor() as cursor:
        cursor.execute("SELECT user_id, skill_id FROM user_skill")
        for row in cursor.fetchall():
            user_skills.append((row[0], row[1]))
    mysql_conn.close()
    
    print(f"Fetched {len(user_skills)} user_skill records from MySQL.")

    # 2. Insert into Neo4j
    neo4j_driver = GraphDatabase.driver('bolt://127.0.0.1:7688', auth=('neo4j', 'default-neo4j-password-please-change-in-production'))
    
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
