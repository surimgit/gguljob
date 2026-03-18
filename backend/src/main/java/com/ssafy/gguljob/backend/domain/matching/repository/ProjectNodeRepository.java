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
            "OPTIONAL MATCH (u)-[:WANTS_ROLE]->(r:Role)<-[:REQUIRES_ROLE]-(p) " +
            "WITH u, p, collect(DISTINCT r.name)[0] AS matchedRole " +
            "OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(p) " +
            "WITH p, matchedRole, COUNT(DISTINCT s) AS skillScore " +
            "WITH p, matchedRole, (CASE WHEN matchedRole IS NOT NULL THEN 10 ELSE 0 END + skillScore) AS score " +
            "RETURN p.id AS projectId, p.title AS projectTitle, coalesce(matchedRole, '무관') AS matchedRole, score " +
            "ORDER BY score DESC, p.id DESC",
        countQuery = "MATCH (p:Project) WHERE p.status = 'RECRUITING' AND NOT p.id IN $joinedProjectIds RETURN count(p)"
    )
    Page<ProjectMatchResultDto> findRecommendedProjectsForUser(
        @Param("userId") String userId,
        @Param("joinedProjectIds") List<String> joinedProjectIds,
        Pageable pageable
    );
}