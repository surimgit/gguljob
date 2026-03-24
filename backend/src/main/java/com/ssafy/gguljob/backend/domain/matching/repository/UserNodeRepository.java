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

            // 적합도 스코어 계산 (일단 포지션 40점 + 스킬 비율 60점)
            "WITH u, " +
            "     CASE " +
            "       WHEN totalSkills = 0 THEN (CASE WHEN isRoleMatched THEN 100 ELSE 50 END) " +
            "       ELSE (CASE WHEN isRoleMatched THEN 40 ELSE 0 END) + toInteger((toFloat(matchedSkills) / totalSkills) * 60) " +
            "     END AS matchScore " +

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