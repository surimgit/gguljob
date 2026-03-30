package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class Neo4jUserSyncBatchService {

    private final UserRepository userRepository;
    private final MatchingProfileService matchingProfileService;
    private final UserEmbeddingService userEmbeddingService;
    private final Neo4jClient neo4jClient;

    @Transactional(transactionManager = "neo4jTransactionManager")
    public void deleteAllUserNodes() {
        neo4jClient.query("MATCH (u:User) DETACH DELETE u").run();
        log.info("Neo4j User 노드 전체 삭제 완료");
    }

    @Transactional(readOnly = true)
    public List<Long> getOnboardedUserIds() {
        return userRepository.findAllOnboardedUserIds();
    }

    public void syncAllUsersToNeo4j() {
        log.info("Neo4j 전체 유저 재동기화 시작");

        deleteAllUserNodes();

        List<Long> userIds = getOnboardedUserIds();
        log.info("온보딩 완료 유저 총 {}명 재동기화 시작", userIds.size());

        int success = 0;
        int fail = 0;
        for (Long userId : userIds) {
            try {
                matchingProfileService.syncUserProfileToGraph(userId);
                userEmbeddingService.updateEmbedding(userId);
                success++;
            } catch (Exception e) {
                log.error("유저 [{}] 동기화 실패: {}", userId, e.getMessage());
                fail++;
            }
        }

        log.info("Neo4j 전체 유저 재동기화 완료 — 성공: {}, 실패: {}", success, fail);
    }
}
