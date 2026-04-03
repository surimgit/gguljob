package com.ssafy.gguljob.backend.domain.job.repository;

import java.util.Collection;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import com.ssafy.gguljob.backend.domain.job.dto.response.JobRecommendationResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class JobRecommendationRepository {

  /*
   * [스코어링 상수 설명] — Cypher 문자열 내부라 Java 상수로 추출 불가, 주석으로 대신함
   * calculate_job_cutoff.py 배치와 반드시 동일하게 유지해야 함
   *
   * vectorScoreNorm 정규화:
   *   - VECTOR_BASELINE = 0.65  : 코사인 유사도 실측 최솟값 (이 미만 → 0점)
   *   - VECTOR_SCALE   = 533.0  : 80 / (0.80 - 0.65) ≈ 533, 유효 구간을 80점으로 선형 확대
   *   - VECTOR_MAX     = 80.0   : 벡터 최고 상한 (100 미만인 이유: 공고 텍스트 ≠ 사람 프로필)
   *
   * finalScore 가중치:
   *   - graphScoreNorm  * 0.5 : 스킬 매칭 비율 (보유 스킬 / 공고 요구 스킬)
   *   - vectorScoreNorm * 0.5 : 시맨틱 유사도 보너스 (임베딩 없으면 0으로 처리 → 스킬만으로 최대 50점)
   *   → 임베딩(포트폴리오/프로필)이 있을 때만 가산점 부여, 없다고 감점하지 않는 구조
   *
   * fallback cutoff (Job에 cutoff 미설정된 경우):
   *   - cutoff_top    = 45.0  : 상위 20% 근사값 (최적합)
   *   - cutoff_high   = 35.0  : 상위 40% 근사값 (적합)
   *   - cutoff_medium = 20.0  : 상위 60% 근사값 (보통)
   *   - cutoff_low    = 10.0  : 상위 80% 근사값 (미흡)
   *   - average_score = 25.0  : 배치 실측 평균 근사값
   */

  private final Neo4jClient neo4jClient;

  public Collection<JobRecommendationResponse> getAllJobsWithScoring(Long userId) {
    String cypherQuery =
        """
            MATCH (u:User {id: $userId})
            WHERE u.embedding IS NOT NULL
            CALL db.index.vector.queryNodes("job_embedding", 300, u.embedding)
            YIELD node AS j, score
            WITH j, u, score AS vectorScore

            OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(j)
            WITH j, u, vectorScore, count(s) AS graphScore

            WHERE NOT j.title CONTAINS '국비'
              AND NOT j.title CONTAINS '교육과정'
              AND NOT j.title CONTAINS '부트캠프'
              AND NOT j.title CONTAINS '수강생'
              AND NOT j.title CONTAINS '훈련생'

            WITH j, graphScore, vectorScore,
                 CASE WHEN j.total_skills = 0 OR j.total_skills IS NULL THEN 0.0
                      ELSE toFloat(graphScore) / j.total_skills * 100.0
                 END AS graphScoreNorm,
                 CASE WHEN vectorScore = 0.0 THEN 0.0
                      WHEN (vectorScore - 0.65) * 533.0 > 80.0 THEN 80.0
                      WHEN (vectorScore - 0.65) * 533.0 < 0.0 THEN 0.0
                      ELSE (vectorScore - 0.65) * 533.0
                 END AS vectorScoreNorm
            WITH j, graphScore, vectorScore, graphScoreNorm,
                 graphScoreNorm * 0.5 + vectorScoreNorm * 0.5 AS rawFinalScore

            WITH j, graphScore, vectorScore, round(rawFinalScore * 10.0) / 10.0 AS finalScore

            WITH j, graphScore, vectorScore, finalScore,
                 round(coalesce(j.cutoff_top, 45.0) * 10.0) / 10.0 AS cTop,
                 round(coalesce(j.cutoff_high, 35.0) * 10.0) / 10.0 AS cHigh,
                 round(coalesce(j.cutoff_medium, 20.0) * 10.0) / 10.0 AS cMedium,
                 round(coalesce(j.cutoff_low, 10.0) * 10.0) / 10.0 AS cLow,
                 coalesce(j.average_score, 25.0) AS averageScore

            WITH j, graphScore, vectorScore, finalScore, cTop, cHigh, cMedium, cLow, averageScore,
                 CASE
                   WHEN finalScore >= cTop    THEN '최적합'
                   WHEN finalScore >= cHigh   THEN '적합'
                   WHEN finalScore >= cMedium THEN '보통'
                   WHEN finalScore >= cLow    THEN '미흡'
                   ELSE '부족'
                 END AS matchStatus,
                 CASE
                   WHEN finalScore >= cTop THEN
                     toInteger(round(20.0 * (CASE WHEN cTop >= 100.0 THEN 0 ELSE (100.0 - finalScore)/(100.0 - cTop) END)))
                   WHEN finalScore >= cHigh THEN
                     toInteger(round(20.0 + 20.0 * (CASE WHEN (cTop - cHigh) <= 0 THEN 0 ELSE (cTop - finalScore)/(cTop - cHigh) END)))
                   WHEN finalScore >= cMedium THEN
                     toInteger(round(40.0 + 20.0 * (CASE WHEN (cHigh - cMedium) <= 0 THEN 0 ELSE (cHigh - finalScore)/(cHigh - cMedium) END)))
                   WHEN finalScore >= cLow THEN
                     toInteger(round(60.0 + 20.0 * (CASE WHEN (cMedium - cLow) <= 0 THEN 0 ELSE (cMedium - finalScore)/(cMedium - cLow) END)))
                   ELSE
                     toInteger(round(80.0 + 20.0 * (CASE WHEN cLow <= 0 THEN 0 ELSE (cLow - finalScore)/cLow END)))
                 END AS rawTopPercentile

            WITH j, graphScore, vectorScore, finalScore, cTop, cHigh, cMedium, cLow, averageScore, matchStatus,
                 CASE
                   WHEN rawTopPercentile < 1 THEN 1
                   WHEN rawTopPercentile > 99 THEN 99
                   WHEN rawTopPercentile = 0 THEN 1
                   ELSE rawTopPercentile
                 END AS topPercentile

            ORDER BY topPercentile ASC, finalScore DESC, j.id ASC
            RETURN j.id AS jobId, j.title AS title, graphScore, vectorScore, finalScore,
              cTop AS cutoffTop, cHigh AS cutoffHigh, cMedium AS cutoffMedium, cLow AS cutoffLow,
              averageScore, topPercentile, matchStatus
            """;

    return neo4jClient.query(cypherQuery)
        .bind(userId).to("userId")
        .fetchAs(JobRecommendationResponse.class)
        .mappedBy((typeSystem, record) -> JobRecommendationResponse.builder()
            .jobId(record.get("jobId").asLong()).title(record.get("title").asString())
            .graphScore(record.get("graphScore").asDouble())
            .vectorScore(record.get("vectorScore").asDouble())
            .finalScore(record.get("finalScore").asDouble())
            .cutoffTop(record.get("cutoffTop").asDouble())
            .cutoffHigh(record.get("cutoffHigh").asDouble())
            .cutoffMedium(record.get("cutoffMedium").asDouble())
            .cutoffLow(record.get("cutoffLow").asDouble())
            .averageScore(record.get("averageScore").asDouble())
            .topPercentile(record.get("topPercentile").asInt())
            .matchStatus(record.get("matchStatus").asString()).build())
        .all();
  }

}
