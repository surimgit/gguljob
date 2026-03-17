package com.ssafy.gguljob.backend.domain.job.repository;

import com.ssafy.gguljob.backend.domain.job.dto.response.JobRecommendationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.Collection;

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
          CALL db.index.vector.queryNodes("job_embedding", 50, u.embedding)
          YIELD node AS j, score
          RETURN j, 0.0 AS gScore, score AS vScore
        }
        WITH j, sum(gScore) AS graphScore, sum(vScore) AS vectorScore
        WITH j, graphScore, vectorScore, (graphScore * 0.4) + (vectorScore * 10 * 0.6) AS finalScore
        RETURN j.id AS jobId, j.title AS title, graphScore, vectorScore, finalScore,
               coalesce(j.cutoff_high, 70.0) AS cutoffHigh,
               coalesce(j.cutoff_medium, 40.0) AS cutoffMedium,
               coalesce(j.average_score, 50.0) AS averageScore
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
            .cutoffMedium(record.get("cutoffMedium").asDouble()).build())
        .all();
  }
}
