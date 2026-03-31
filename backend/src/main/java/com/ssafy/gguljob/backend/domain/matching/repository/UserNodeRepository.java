package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.dto.MemberMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.entity.UserNode;
import java.util.List;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface UserNodeRepository extends Neo4jRepository<UserNode, Long> {
    /**
     * 프로젝트에 적합한 유저를 추천 점수 순으로 전체 조회합니다.
     * 점수 기준: 역할 일치(40점) + 스킬 일치 비율(60점) + 도메인 경험(+15점) + 스킬 경험(+10점) → graphScore * 0.6
     *           + 임베딩 유사도(vectorScore) * 0.4
     * 도메인/스킬 경험 계산은 UserNode 프로퍼티(experiencedDomains, experiencedSkills) 조회로 처리합니다.
     * (기존 2-hop PARTICIPATED_IN EXISTS 서브쿼리 대비 대폭 성능 개선)
     * 페이지네이션은 Java에서 처리합니다. (countQuery 제거로 Neo4j 쿼리 1회)
     */
    @Query(
        "MATCH (p:Project {id: $projectId}) " +
        "OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(reqSkill:Skill) " +
        "WITH p, count(reqSkill) AS totalSkills " +

        "MATCH (u:User) " +
        "WHERE NOT u.id IN $excludedUserIds " +
        "AND ($keyword IS NULL OR u.userName CONTAINS $keyword OR EXISTS { MATCH (u)-[:WANTS_ROLE]->(kr:Role) WHERE kr.name CONTAINS $keyword }) " +
        "AND ($position IS NULL OR EXISTS { MATCH (u)-[:WANTS_ROLE]->(r:Role) WHERE r.name = $position }) " +
        "AND ($experienceLevel IS NULL OR u.experienceLevel = $experienceLevel) " +

        "OPTIONAL MATCH (u)-[:WANTS_ROLE]->(mr:Role)<-[:REQUIRES_ROLE]-(p) " +
        "WITH p, totalSkills, u, count(mr) > 0 AS isRoleMatched " +
        "OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(s:Skill)<-[:HAS_SKILL]-(u) " +
        "WITH p, totalSkills, u, isRoleMatched, count(s) AS matchedSkills " +

        "WITH p, u, " +
        "     (CASE WHEN isRoleMatched THEN 40 ELSE 0 END + " +
        "      CASE WHEN totalSkills = 0 THEN 0 ELSE toInteger((toFloat(matchedSkills) / totalSkills) * 60) END) AS graphScore " +

        "WITH p, u, graphScore, " +
        "     p.domain IN coalesce(u.experiencedDomains, []) AS hasDomainExp, " +
        "     EXISTS { MATCH (p)-[:REQUIRES_SKILL]->(ps:Skill) WHERE ps.name IN coalesce(u.experiencedSkills, []) } AS hasSkillExp " +
        "WITH p, u, " +
        "     graphScore + (CASE WHEN hasDomainExp THEN 15 ELSE 0 END) + (CASE WHEN hasSkillExp THEN 10 ELSE 0 END) AS graphScore " +

        "RETURN toString(u.id) AS userId, graphScore " +
        "ORDER BY graphScore DESC, u.id DESC"
    )
    List<MemberMatchResultDto> findRecommendedMembersForProject(
        @Param("projectId") String projectId,
        @Param("excludedUserIds") List<Long> excludedUserIds,
        @Param("keyword") String keyword,
        @Param("position") String position,
        @Param("experienceLevel") String experienceLevel
    );
}