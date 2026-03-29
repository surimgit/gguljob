package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.entity.ProjectNode;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectNodeRepository extends Neo4jRepository<ProjectNode, String> {

    @Query(
        value = "MATCH (u:User {id: $userId}) " +
            "MATCH (p:Project) WHERE p.status = 'RECRUITING' AND coalesce(p.hasOpenPosition, true) = true " +
            "AND NOT p.id IN $joinedProjectIds " +
            "AND ($keyword IS NULL OR p.title CONTAINS $keyword) " +
            "AND ($domains IS NULL OR p.domain IN $domains) " +
            "AND ($roles IS NULL OR EXISTS { MATCH (p)-[:REQUIRES_ROLE]->(r:Role) WHERE r.name IN $roles }) " +
            "AND ($skillNames IS NULL OR size($skillNames) = 0 OR EXISTS { MATCH (p)-[:REQUIRES_SKILL]->(s:Skill) WHERE s.name IN $skillNames }) " +

            // 프로젝트가 요구하는 총 스킬 수
            "OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(reqSkill:Skill) " +
            "WITH u, p, count(reqSkill) AS totalSkills " +

            // 직무 매칭 여부
            "OPTIONAL MATCH (u)-[:WANTS_ROLE]->(mr:Role)<-[:REQUIRES_ROLE]-(p) " +
            "WITH u, p, totalSkills, collect(DISTINCT mr.name)[0] AS matchedRole " +

            // 스킬 겹침 수
            "OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(p) " +
            "WITH u, p, totalSkills, matchedRole, count(DISTINCT s) AS matchedSkills " +

            // 그래프 점수: 직무 40점 + 스킬 정규화 60점
            "WITH u, p, matchedRole, " +
            "     (CASE WHEN matchedRole IS NOT NULL THEN 40 ELSE 0 END + " +
            "      CASE WHEN totalSkills = 0 THEN 0 ELSE toInteger((toFloat(matchedSkills) / totalSkills) * 60) END) AS graphScore " +

            // 프로젝트 경험 가산점: 같은 도메인 프로젝트 참여 경험 15점 + 스킬 겹침 경험 10점
            "OPTIONAL MATCH (u)-[:PARTICIPATED_IN]->(past:Project) " +
            "WHERE past.domain = p.domain AND past.id <> p.id " +
            "WITH u, p, matchedRole, graphScore, count(past) > 0 AS hasDomainExp " +
            "OPTIONAL MATCH (u)-[:PARTICIPATED_IN]->(past2:Project)-[:REQUIRES_SKILL]->(ps:Skill)<-[:REQUIRES_SKILL]-(p) " +
            "WHERE past2.id <> p.id " +
            "WITH u, p, matchedRole, graphScore, hasDomainExp, count(DISTINCT ps) > 0 AS hasSkillExp " +
            "WITH u, p, matchedRole, " +
            "     graphScore + (CASE WHEN hasDomainExp THEN 15 ELSE 0 END) + (CASE WHEN hasSkillExp THEN 10 ELSE 0 END) AS graphScore " +

            // 벡터 유사도 점수 (임베딩 없으면 0)
            "WITH u, p, matchedRole, graphScore, " +
            "     CASE WHEN u.embedding IS NOT NULL AND p.embedding IS NOT NULL " +
            "          THEN toInteger(reduce(dot = 0.0, i IN range(0, size(u.embedding)-1) | dot + u.embedding[i] * p.embedding[i]) * 100) " +
            "          ELSE 0 END AS vectorScore " +

            // 최종 점수: 그래프 60% + 벡터 40%
            "WITH p, matchedRole, toInteger(graphScore * 0.6 + vectorScore * 0.4) AS score " +
            "RETURN p.id AS projectId, p.title AS projectTitle, coalesce(matchedRole, '무관') AS matchedRole, score " +
            "ORDER BY score DESC, p.id DESC SKIP $skip LIMIT $limit",

        countQuery = "MATCH (p:Project) WHERE p.status = 'RECRUITING' AND coalesce(p.hasOpenPosition, true) = true AND NOT p.id IN $joinedProjectIds " +
            "AND ($keyword IS NULL OR p.title CONTAINS $keyword) " +
            "AND ($domains IS NULL OR p.domain IN $domains) " +
            "AND ($roles IS NULL OR EXISTS { MATCH (p)-[:REQUIRES_ROLE]->(r:Role) WHERE r.name IN $roles }) " +
            "AND ($skillNames IS NULL OR size($skillNames) = 0 OR EXISTS { MATCH (p)-[:REQUIRES_SKILL]->(s:Skill) WHERE s.name IN $skillNames }) " +
            "RETURN count(p)"
    )
    Page<ProjectMatchResultDto> findRecommendedProjectsForUser(
        @Param("userId") Long userId,
        @Param("joinedProjectIds") List<String> joinedProjectIds,
        @Param("keyword") String keyword,
        @Param("domains") List<String> domains,
        @Param("roles") List<String> roles,
        @Param("skillNames") List<String> skillNames,
        Pageable pageable
    );

    @Query("MERGE (p:Project {id: $projectId}) " +
        "SET p.title = $title, p.domain = $domain, p.status = $status, p.hasOpenPosition = $hasOpenPosition " +
        "WITH p " +
        "OPTIONAL MATCH (p)-[r:REQUIRES_ROLE|REQUIRES_SKILL]->() " +
        "DELETE r " +
        "WITH p " +
        "UNWIND $roles AS roleName " +
        "MERGE (r:Role {name: roleName}) " +
        "MERGE (p)-[:REQUIRES_ROLE]->(r) " +
        "WITH p " +
        "UNWIND $skills AS skillName " +
        "MERGE (s:Skill {name: skillName}) " +
        "MERGE (p)-[:REQUIRES_SKILL]->(s)")
    void syncProjectToNeo4j(@Param("projectId") String projectId,
        @Param("title") String title,
        @Param("domain") String domain,
        @Param("status") String status,
        @Param("hasOpenPosition") boolean hasOpenPosition,
        @Param("roles") List<String> roles,
        @Param("skills") List<String> skills);
}