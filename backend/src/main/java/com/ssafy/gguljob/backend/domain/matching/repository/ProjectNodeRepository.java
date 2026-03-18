package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.entity.ProjectNode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectNodeRepository extends Neo4jRepository<ProjectNode, String> {

    @Query(
        value = "MATCH (u:User {id: $userId})-[:ROLES]->(r:Role)<-[:REQUIRES_ROLE]-(p:Project) " +
            "OPTIONAL MATCH (u)-[:SKILLS]->(s:Skill)<-[:REQUIRES_SKILL]-(p) " +
            "WITH p, r, COUNT(s) AS skillMatchScore " +
            "RETURN p.id AS projectId, p.title AS projectTitle, r.name AS matchedRole, skillMatchScore AS score  " +
            "ORDER BY score DESC",
        countQuery = "MATCH (u:User {id: $userId})-[:ROLES]->(:Role)<-[:REQUIRES_ROLE]-(p:Project) RETURN count(DISTINCT p)"
    )
    Page<ProjectMatchResultDto> findRecommendedProjectsForUser(
        @Param("userId") String userId,
        Pageable pageable
    );
}