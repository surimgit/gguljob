package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.entity.ProjectNode;
import java.util.List;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectNodeRepository extends Neo4jRepository<ProjectNode, String> {
    @Query("MATCH (u:User {id: $userId})-[:ROLES]->(r:Role)<-[:REQUIRES_ROLE]-(p:Project) " +
        "OPTIONAL MATCH (u)-[:SKILLS]->(s:Skill)<-[:REQUIRES_SKILL]-(p) " +
        "WITH p, r, COUNT(s) AS skillMatchScore " +
        "RETURN p.id AS projectId, p.title AS projectTitle, r.name AS matchedRole, skillMatchScore AS score " +
        "ORDER BY score DESC")
    List<ProjectMatchResultDto> findRecommendedProjectsForUser(@Param("userId") String userId);
}