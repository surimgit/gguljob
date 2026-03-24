package com.ssafy.gguljob.backend.domain.matching.controller;

import com.ssafy.gguljob.backend.domain.matching.service.Neo4jUserSyncBatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/neo4j")
@RequiredArgsConstructor
public class AdminNeo4jController {

    private final Neo4jUserSyncBatchService neo4jUserSyncBatchService;

    @PostMapping("/sync-users")
    public ResponseEntity<String> syncAllUsers() {
        log.info("관리자 요청: 전체 유저 Neo4j 재동기화 시작");
        neo4jUserSyncBatchService.syncAllUsersToNeo4j();
        return ResponseEntity.ok("전체 유저 Neo4j 재동기화 완료");
    }
}
