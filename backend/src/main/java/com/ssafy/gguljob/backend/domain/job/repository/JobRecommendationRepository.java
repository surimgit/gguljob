package com.ssafy.gguljob.backend.domain.job.repository;

import java.util.Collection;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import com.ssafy.gguljob.backend.domain.job.dto.response.JobRecommendationResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class JobRecommendationRepository {

  private final Neo4jClient neo4jClient;

  public Collection<JobRecommendationResponse> recommendJobsForUser(Long userId, int limit,
      int skip) {
    // 팁: 아직 배치가 한 번도 안 돌아서 cutoff 값이 Null인 공고를 대비하여 coalesce(j.cutoff_high, 70.0) 로 기본 70점을 세팅해줍니다.
    String cypherQuery = """
        MATCH (u:User {id: $userId})
        CALL {
          WITH u
          MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j:Job)
          WITH j, count(s) AS gScore
          ORDER BY gScore DESC LIMIT 50
          RETURN j, gScore, 0.0 AS vScore

          UNION

          WITH u
          WITH u WHERE u.embedding IS NOT NULL
          CALL db.index.vector.queryNodes("job_embedding", 50, u.embedding)
          YIELD node AS j, score
          RETURN j, 0.0 AS gScore, score AS vScore
        }
        WITH j, u, sum(gScore) AS graphScore, sum(vScore) AS vectorScore
        WHERE NOT j.title CONTAINS '국비'
          AND NOT j.title CONTAINS '교육과정'
          AND NOT j.title CONTAINS '부트캠프'
          AND NOT j.title CONTAINS '수강생'
          AND NOT j.title CONTAINS '훈련생'
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
        OPTIONAL MATCH (g:GlobalStats {id: 'recommendation'})
        RETURN j.id AS jobId, j.title AS title, graphScore, vectorScore, finalScore,
               coalesce(j.cutoff_high, 70.0) AS cutoffHigh,
               coalesce(j.cutoff_medium, 40.0) AS cutoffMedium,
               coalesce(j.average_score, 50.0) AS averageScore,
               coalesce(g.global_average_score, 50.0) AS globalAverageScore,
               coalesce(g.global_cutoff_high, 70.0) AS globalCutoffHigh,
               coalesce(g.global_cutoff_medium, 40.0) AS globalCutoffMedium
        ORDER BY finalScore DESC
        SKIP $skip
        LIMIT $limit
        """;

    return neo4jClient.query(cypherQuery).bind(userId).to("userId").bind(limit).to("limit")
        .bind(skip).to("skip").fetchAs(JobRecommendationResponse.class)
        .mappedBy((typeSystem, record) -> JobRecommendationResponse.builder()
            .jobId(record.get("jobId").asLong()).title(record.get("title").asString())
            .graphScore(record.get("graphScore").asDouble())
            .vectorScore(record.get("vectorScore").asDouble())
            .finalScore(record.get("finalScore").asDouble())
            .cutoffHigh(record.get("cutoffHigh").asDouble())
            .cutoffMedium(record.get("cutoffMedium").asDouble())
            .averageScore(record.get("averageScore").asDouble())
            .globalAverageScore(record.get("globalAverageScore").asDouble())
            .globalCutoffHigh(record.get("globalCutoffHigh").asDouble())
            .globalCutoffMedium(record.get("globalCutoffMedium").asDouble()).build())
        .all();
  }
}
