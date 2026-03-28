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
            // 프로젝트가 요구하는 총 기술 스택 개수 파악
            "OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(reqSkill:Skill) " +
            "WITH p, count(reqSkill) AS totalSkills " +

            // 이미 팀원이거나 합류 대기 중인 유저 제외
            "MATCH (u:User) " +
            "WHERE NOT u.id IN $excludedUserIds " +

            // 동적 필터링 & 검색
            "AND ($keyword IS NULL OR u.userName CONTAINS $keyword OR EXISTS { MATCH (u)-[:WANTS_ROLE]->(kr:Role) WHERE kr.name CONTAINS $keyword }) " +
            "AND ($position IS NULL OR EXISTS { MATCH (u)-[:WANTS_ROLE]->(r:Role) WHERE r.name = $position }) " +
            "AND ($experienceLevel IS NULL OR u.experienceLevel = $experienceLevel) " +

            // 포지션 일치 여부 확인
            "OPTIONAL MATCH (u)-[:WANTS_ROLE]->(mr:Role)<-[:REQUIRES_ROLE]-(p) " +
            "WITH p, totalSkills, u, count(mr) > 0 AS isRoleMatched " +

            // 기술 스택 일치 개수 확인
            "OPTIONAL MATCH (p)-[:REQUIRES_SKILL]->(s:Skill)<-[:HAS_SKILL]-(u) " +
            "WITH p, totalSkills, u, isRoleMatched, count(s) AS matchedSkills " +

            // 그래프 점수: 직무 40점 + 스킬 비율 60점
            "WITH p, u, " +
            "     (CASE WHEN isRoleMatched THEN 40 ELSE 0 END + " +
            "      CASE WHEN totalSkills = 0 THEN 0 ELSE toInteger((toFloat(matchedSkills) / totalSkills) * 60) END) AS graphScore " +

            // 벡터 유사도 점수 (유저 임베딩 ↔ 프로젝트 임베딩, 없으면 0)
            "WITH u, graphScore, " +
            "     CASE WHEN u.embedding IS NOT NULL AND p.embedding IS NOT NULL " +
            "          THEN toInteger(reduce(dot = 0.0, i IN range(0, size(u.embedding)-1) | dot + u.embedding[i] * p.embedding[i]) * 100) " +
            "          ELSE 0 END AS vectorScore " +

            // 최종 점수: 그래프 60% + 벡터 40%
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