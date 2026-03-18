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
        value = "MATCH (p:Project), (u:User {id: $userId}) " +

            // 직무(Role)가 겹치는지 선택적으로 확인
            "OPTIONAL MATCH (u)-[:WANTS_ROLE]->(r:Role)<-[:REQUIRES_ROLE]-(p) " +
            "WITH u, p, collect(DISTINCT r.name)[0] AS matchedRole " +

            // 스킬이 겹치는지 선택적으로 확인
            "OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(p) " +
            "WITH p, matchedRole, COUNT(DISTINCT s) AS skillScore " +

            // 직무가 맞으면 가중치 추가
            "WITH p, matchedRole, (CASE WHEN matchedRole IS NOT NULL THEN 10 ELSE 0 END + skillScore) AS score " +

            // 5. 겹치는게 없다면 가중치 없음
            "RETURN p.id AS projectId, p.title AS projectTitle, coalesce(matchedRole, '무관') AS matchedRole, score " +
            "ORDER BY score DESC, p.id DESC", // 점수 높은 순, 점수가 같으면 최신 프로젝트 순

        countQuery = "MATCH (p:Project) RETURN count(p)"
    )
    Page<ProjectMatchResultDto> findRecommendedProjectsForUser(
        @Param("userId") String userId,
        Pageable pageable
    );
}