import os
import numpy as np
from neo4j import GraphDatabase
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

NEO4J_URI = "bolt://127.0.0.1:7688"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "default-neo4j-password-please-change-in-production"

# 백엔드 API와 동일하게 200, 2000 구조 차용
EVAL_LIMIT_GRAPH = 500
EVAL_LIMIT_VECTOR = 3000

def get_users(tx):
    # 최근 접속했거나 유효한 유저들의 ID를 가져옴 (여기서는 최대 1000명 샘플링) 
    query = """
    MATCH (u:User)
    RETURN u.id AS user_id
    LIMIT 1000
    """
    result = tx.run(query)
    return [record["user_id"] for record in result]

def evaluate_user_jobs(tx, user_id):
    query = """
    MATCH (u:User {id: $user_id})
    CALL {
      WITH u
      MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j:Job)
      WITH j, count(s) AS gScore
      ORDER BY gScore DESC LIMIT $limitGraph
      RETURN j, 0.0 AS rawVScore

      UNION

      WITH u
      WITH u WHERE u.embedding IS NOT NULL
      CALL db.index.vector.queryNodes("job_embedding", $limitVector, u.embedding)
      YIELD node AS j, score
      RETURN j, score AS rawVScore
    }
    WITH j, u, sum(rawVScore) AS vectorScore

    OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j)
    WITH j, u, vectorScore, count(s) AS graphScore

    WITH j, graphScore, vectorScore,
         CASE WHEN j.total_skills = 0 OR j.total_skills IS NULL THEN 0.0
              ELSE toFloat(graphScore) / j.total_skills * 100.0
         END AS graphScoreNorm,
         CASE WHEN vectorScore = 0.0 THEN 0.0
              WHEN (vectorScore - 0.65) * 533.0 > 80.0 THEN 80.0
              WHEN (vectorScore - 0.65) * 533.0 < 0.0 THEN 0.0
              ELSE (vectorScore - 0.65) * 533.0
         END AS vectorScoreNorm
    WITH j, graphScoreNorm * 0.5 + vectorScoreNorm * 0.5 AS finalScore
    RETURN j.id AS job_id, finalScore AS match_percentage
    """
    result = tx.run(query, user_id=user_id, limitGraph=EVAL_LIMIT_GRAPH, limitVector=EVAL_LIMIT_VECTOR)
    return [{"job_id": record["job_id"], "score": record["match_percentage"]} for record in result]

def update_job_cutoffs(tx, updates):
    # 계산된 커트라인과 평균을 Job 노드에 업데이트
    query = """
    UNWIND $updates AS update
    MATCH (j:Job {id: update.job_id})
    SET j.cutoff_high = update.high_cutoff,
        j.cutoff_medium = update.medium_cutoff,
        j.average_score = update.avg_score
    """
    tx.run(query, updates=updates)


def main():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) 

    job_scores_map = {} # {job_id: [score1, score2, ...]}

    with driver.session() as session:
        print("1. Fetching active users...")
        user_ids = session.execute_read(get_users)
        print(f" -> Found {len(user_ids)} users for evaluation.")

        print("2. Calculating job scores for users...")
        for i, user_id in enumerate(user_ids):
            if i > 0 and i % 5 == 0:
                print(f" -> Processed {i}/{len(user_ids)} users...")

            evaluations = session.execute_read(evaluate_user_jobs, user_id)     
            for ev in evaluations:
                jid = ev["job_id"]
                job_scores_map.setdefault(jid, []).append(ev["score"])

        print(f" -> Collected score data for {len(job_scores_map)} distinct jobs.")                                                                             
        print("3. Calculating Job-specific thresholds using Item Bias Normalization...")
        all_scores = [score for scores in job_scores_map.values() for score in scores]                                                                                  
        global_avg = np.mean(all_scores) if all_scores else 50.0
        global_high = np.percentile(all_scores, 70) if all_scores else 70.0     
        global_medium = np.percentile(all_scores, 40) if all_scores else 40.0   

        updates = []
        for job_id, scores in job_scores_map.items():
            if len(scores) < 5:
                avg_score = global_avg
                high_cutoff = global_high
                medium_cutoff = global_medium
            else:
                avg_score = np.mean(scores)
                high_cutoff = np.percentile(scores, 70)
                medium_cutoff = np.percentile(scores, 40)

            updates.append({
                "job_id": job_id,
                "high_cutoff": float(high_cutoff),
                "medium_cutoff": float(medium_cutoff),
                "avg_score": float(avg_score)
            })

        session.execute_write(update_job_cutoffs, updates)
        update_count = len(updates)

        print(f" -> Successfully updated cutoffs for {update_count} jobs. (Avg: {global_avg:.2f}, High: {global_high:.2f}, Med: {global_medium:.2f})")                                           
    driver.close()
    print("Batch Processing Completed!")

if __name__ == "__main__":
    main()
