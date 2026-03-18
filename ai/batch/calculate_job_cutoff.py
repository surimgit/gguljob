import os
import numpy as np
from neo4j import GraphDatabase
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

NEO4J_URI = "bolt://127.0.0.1:7688"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "default-neo4j-password-please-change-in-production"

# 유저당 몇 개의 Job을 평가할 것인지 (배치 성능 조절용)
EVAL_LIMIT_PER_USER = 10000

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
    # 백엔드 API와 동일한 알고리즘을 사용하여 이 유저에 대한 Job들의 점수 백분율(100점 만점 기준 환산)을 계산
    query = """
    MATCH (u:User {id: $user_id})
    CALL {
      WITH u
      MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j:Job)
      WITH j, count(s) AS gScore
      ORDER BY gScore DESC LIMIT $limit
      RETURN j, gScore, 0.0 AS vScore

      UNION

      WITH u
      WITH u WHERE u.embedding IS NOT NULL
      CALL db.index.vector.queryNodes("job_embedding", $limit, u.embedding)
      YIELD node AS j, score
      RETURN j, 0.0 AS gScore, score AS vScore
    }
    WITH j, u, sum(gScore) AS graphScore, sum(vScore) AS vectorScore
    WITH j, graphScore, vectorScore,
         CASE
           WHEN u.embedding IS NULL THEN
             (CASE WHEN graphScore * 25.0 > 100.0 THEN 100.0 ELSE graphScore * 25.0 END) * 0.7
           ELSE
             ((CASE WHEN vectorScore <= 0.55 THEN 0.0
                    WHEN (vectorScore - 0.55) * 400.0 > 100.0 THEN 100.0 
                    ELSE (vectorScore - 0.55) * 400.0 END) * 0.5) +
             ((CASE WHEN graphScore * 25.0 > 100.0 THEN 100.0 ELSE graphScore * 25.0 END) * 0.5)
         END AS finalScore
    RETURN j.id AS job_id, finalScore AS match_percentage
    """
    result = tx.run(query, user_id=user_id, limit=EVAL_LIMIT_PER_USER)
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

def update_global_stats(tx, global_avg, global_high, global_medium):
    query = '''
    MERGE (g:GlobalStats {id: "recommendation"})
    SET g.global_average_score = $global_avg,
        g.global_cutoff_high = $global_high,
        g.global_cutoff_medium = $global_medium,
        g.last_updated = datetime()
    '''
    tx.run(query, global_avg=global_avg, global_high=global_high, global_medium=global_medium)

def main():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    job_scores_map = {} # {job_id: [score1, score2, ...]}
    
    with driver.session() as session:
        print("1. Fetching active users...")
        user_ids = session.execute_read(get_users)
        print(f" -> Found {len(user_ids)} users for evaluation.")
        
        print("2. Calculating job scores for users...")
        for i, user_id in enumerate(user_ids):
            if i > 0 and i % 100 == 0:
                print(f" -> Processed {i}/{len(user_ids)} users...")
                
            evaluations = session.execute_read(evaluate_user_jobs, user_id)
            for ev in evaluations:
                jid = ev["job_id"]
                job_scores_map.setdefault(jid, []).append(ev["score"])
                
        print(f" -> Collected score data for {len(job_scores_map)} distinct jobs.")
        
        print("3. Calculating Job-specific thresholds using Item Bias Normalization...")
        # 전체 공고의 평균 점수 (데이터가 부족한 공고를 위한 기본값)
        all_scores = [score for scores in job_scores_map.values() for score in scores]
        global_avg = np.mean(all_scores) if all_scores else 50.0
        global_high = np.percentile(all_scores, 70) if all_scores else 70.0
        global_medium = np.percentile(all_scores, 40) if all_scores else 40.0
        
        updates = []
        for job_id, scores in job_scores_map.items():
            # 평가된 유저 수가 너무 적으면(예: 5명 미만) 글로벌 평균을 사용하여 신뢰도 보정
            if len(scores) < 5:
                avg_score = global_avg
                high_cutoff = global_high
                medium_cutoff = global_medium
            else:
                # 해당 공고에 지원/매칭된 유저들 사이에서의 70%, 40% 백분위수 및 평균
                avg_score = np.mean(scores)
                high_cutoff = np.percentile(scores, 70)
                medium_cutoff = np.percentile(scores, 40)
            
            updates.append({
                "job_id": job_id,
                "high_cutoff": float(high_cutoff),
                "medium_cutoff": float(medium_cutoff),
                "avg_score": float(avg_score)
            })
            
        # batch update!
        session.execute_write(update_job_cutoffs, updates)
        update_count = len(updates)
            
        print(f" -> Successfully updated cutoffs for {update_count} jobs.")

        print("4. Updating GlobalStats node...")
        session.execute_write(update_global_stats, float(global_avg), float(global_high), float(global_medium))
        print(f" -> Global stats updated (Avg: {global_avg:.2f}, High: {global_high:.2f}, Med: {global_medium:.2f})")
        
    driver.close()
    print("Batch Processing Completed!")

if __name__ == "__main__":
    main()
