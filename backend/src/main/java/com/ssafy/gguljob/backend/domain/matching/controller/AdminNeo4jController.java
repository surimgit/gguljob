package com.ssafy.gguljob.backend.domain.matching.controller;

import com.ssafy.gguljob.backend.domain.matching.service.Neo4jUserSyncBatchService;
import com.ssafy.gguljob.backend.domain.matching.service.Neo4jProjectSyncBatchService;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/neo4j")
@RequiredArgsConstructor
public class AdminNeo4jController {

    private final Neo4jUserSyncBatchService neo4jUserSyncBatchService;
    private final Neo4jProjectSyncBatchService neo4jProjectSyncBatchService;
    private final Neo4jClient neo4jClient;
    private final UserRepository userRepository;

    @PostMapping("/sync-users")
    public ResponseEntity<String> syncAllUsers() {
        log.info("관리자 요청: 전체 유저 Neo4j 재동기화 시작");
        neo4jUserSyncBatchService.syncAllUsersToNeo4j();
        return ResponseEntity.ok("전체 유저 Neo4j 재동기화 완료");
    }

    @PostMapping("/sync-projects")
    public ResponseEntity<String> syncAllRecruitingProjects() {
        log.info("관리자 요청: 모집 중 프로젝트 Neo4j 재동기화 시작");
        int syncedCount = neo4jProjectSyncBatchService.syncRecruitingProjectsToNeo4j();
        return ResponseEntity.ok("모집 중 프로젝트 Neo4j 재동기화 완료: " + syncedCount + "건");
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long userCount = neo4jClient.query("MATCH (u:User) RETURN count(u) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        long hasSkillCount = neo4jClient.query("MATCH ()-[r:HAS_SKILL]->() RETURN count(r) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        long wantsRoleCount = neo4jClient.query("MATCH ()-[r:WANTS_ROLE]->() RETURN count(r) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        long jobCount = neo4jClient.query("MATCH (j:Job) RETURN count(j) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        long projectCount = neo4jClient.query("MATCH (p:Project) RETURN count(p) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        long totalMysqlUsers = userRepository.count();
        long onboardedMysqlUsers = userRepository.findAllOnboardedUserIds().size();

        long skillWithId = neo4jClient.query("MATCH (s:Skill) WHERE s.id IS NOT NULL RETURN count(s) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);
        long skillWithName = neo4jClient.query("MATCH (s:Skill) WHERE s.name IS NOT NULL RETURN count(s) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);
        long skillTotal = neo4jClient.query("MATCH (s:Skill) RETURN count(s) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        long teamSkillMatchable = neo4jClient.query(
            "MATCH (u:User)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(p:Project) RETURN count(DISTINCT s) AS cnt")
            .fetchAs(Long.class).mappedBy((t, r) -> r.get("cnt").asLong()).one().orElse(0L);

        java.util.LinkedHashMap<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("neo4j_userNodes", userCount);
        result.put("neo4j_hasSkillRelations", hasSkillCount);
        result.put("neo4j_wantsRoleRelations", wantsRoleCount);
        result.put("neo4j_jobNodes", jobCount);
        result.put("neo4j_projectNodes", projectCount);
        result.put("mysql_totalUsers", totalMysqlUsers);
        result.put("mysql_onboardedUsers", onboardedMysqlUsers);
        result.put("skill_total", skillTotal);
        result.put("skill_with_id", skillWithId);
        result.put("skill_with_name", skillWithName);
        result.put("team_skill_matchable_count", teamSkillMatchable);
        return ResponseEntity.ok(result);
    }
}
