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
            "MATCH (p:Project) WHERE p.status = 'RECRUITING' " +
            "AND NOT p.id IN $joinedProjectIds " +
            "AND ($keyword IS NULL OR p.title CONTAINS $keyword) " +
            "AND ($domain IS NULL OR p.domain = $domain) " +
            "AND ($role IS NULL OR EXISTS { MATCH (p)-[:REQUIRES_ROLE]->(r:Role) WHERE r.name = $role }) " +
            "AND ($skillIds IS NULL OR size($skillIds) = 0 OR EXISTS { MATCH (p)-[:REQUIRES_SKILL]->(s:Skill) WHERE s.id IN $skillIds }) " +
            "OPTIONAL MATCH (u)-[:WANTS_ROLE]->(r:Role)<-[:REQUIRES_ROLE]-(p) " +
            "WITH u, p, collect(DISTINCT r.name)[0] AS matchedRole " +
            "OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(p) " +
            "WITH p, matchedRole, COUNT(DISTINCT s) AS skillScore " +
            "WITH p, matchedRole, (CASE WHEN matchedRole IS NOT NULL THEN 10 ELSE 0 END + skillScore) AS score " +
            "RETURN p.id AS projectId, p.title AS projectTitle, coalesce(matchedRole, '무관') AS matchedRole, score " +
            "ORDER BY score DESC, p.id DESC SKIP $skip LIMIT $limit",

        countQuery = "MATCH (p:Project) WHERE p.status = 'RECRUITING' AND NOT p.id IN $joinedProjectIds " +
            "AND ($keyword IS NULL OR p.title CONTAINS $keyword) " +
            "AND ($domain IS NULL OR p.domain = $domain) " +
            "AND ($role IS NULL OR EXISTS { MATCH (p)-[:REQUIRES_ROLE]->(r:Role) WHERE r.name = $role }) " +
            "AND ($skillIds IS NULL OR size($skillIds) = 0 OR EXISTS { MATCH (p)-[:REQUIRES_SKILL]->(s:Skill) WHERE s.id IN $skillIds }) " +
            "RETURN count(p)"
    )
    Page<ProjectMatchResultDto> findRecommendedProjectsForUser(
        @Param("userId") String userId,
        @Param("joinedProjectIds") List<String> joinedProjectIds,
        @Param("keyword") String keyword,
        @Param("domain") String domain,
        @Param("role") String role,
        @Param("skillIds") List<Long> skillIds,
        Pageable pageable
    );

    @Query("MERGE (p:Project {id: $projectId}) " +
        "SET p.title = $title, p.domain = $domain, p.status = $status " +
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
        @Param("roles") List<String> roles,
        @Param("skills") List<String> skills);
}