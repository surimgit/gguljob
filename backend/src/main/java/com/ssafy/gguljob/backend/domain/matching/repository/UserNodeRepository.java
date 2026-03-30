package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.dto.MemberMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.entity.UserNode;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface UserNodeRepository extends Neo4jRepository<UserNode, Long> {
    @Query(
        value = "MATCH (p:Project {id: $projectId}) " +
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

            // EXISTS 서브쿼리로 short-circuit: 조건 만족하면 즉시 탐색 중단
            "WITH p, u, graphScore, " +
            "     EXISTS { MATCH (u)-[:PARTICIPATED_IN]->(past:Project) WHERE past.domain = p.domain AND past.id <> p.id } AS hasDomainExp, " +
            "     EXISTS { MATCH (u)-[:PARTICIPATED_IN]->(past2:Project)-[:REQUIRES_SKILL]->(ps:Skill)<-[:REQUIRES_SKILL]-(p) WHERE past2.id <> p.id } AS hasSkillExp " +
            "WITH p, u, " +
            "     graphScore + (CASE WHEN hasDomainExp THEN 15 ELSE 0 END) + (CASE WHEN hasSkillExp THEN 10 ELSE 0 END) AS graphScore " +

            "WITH u, graphScore, " +
            "     CASE WHEN u.embedding IS NOT NULL AND p.embedding IS NOT NULL " +
            "          THEN toInteger(reduce(dot = 0.0, i IN range(0, size(u.embedding)-1) | dot + u.embedding[i] * p.embedding[i]) * 100) " +
            "          ELSE 0 END AS vectorScore " +

            "WITH u, toInteger(graphScore * 0.6 + vectorScore * 0.4) AS matchScore " +
            "RETURN toString(u.id) AS userId, matchScore " +
            "ORDER BY matchScore DESC, u.id DESC " +
            "SKIP $skip LIMIT $limit",

        countQuery = "MATCH (u:User) " +
            "WHERE NOT u.id IN $excludedUserIds " +
            "AND ($keyword IS NULL OR u.userName CONTAINS $keyword OR EXISTS { MATCH (u)-[:WANTS_ROLE]->(kr:Role) WHERE kr.name CONTAINS $keyword }) " +
            "AND ($position IS NULL OR EXISTS { MATCH (u)-[:WANTS_ROLE]->(r:Role) WHERE r.name = $position }) " +
            "AND ($experienceLevel IS NULL OR u.experienceLevel = $experienceLevel) " +
            "RETURN count(u)"
    )
    Page<MemberMatchResultDto> findRecommendedMembersForProject(
        @Param("projectId") String projectId,
        @Param("excludedUserIds") List<Long> excludedUserIds,
        @Param("keyword") String keyword,
        @Param("position") String position,
        @Param("experienceLevel") String experienceLevel,
        Pageable pageable
    );
}