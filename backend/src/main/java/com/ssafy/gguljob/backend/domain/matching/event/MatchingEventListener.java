package com.ssafy.gguljob.backend.domain.matching.event;

import com.ssafy.gguljob.backend.domain.matching.service.MatchingProfileService;
import com.ssafy.gguljob.backend.domain.matching.service.MatchingProjectService;
import com.ssafy.gguljob.backend.domain.matching.service.UserEmbeddingService;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class MatchingEventListener {

    private final MatchingProfileService matchingProfileService;
    private final MatchingProjectService matchingProjectService;
    private final UserEmbeddingService userEmbeddingService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserProfileSync(UserProfileSyncEvent event) {
        Long userId = event.userId();

        CompletableFuture<Void> graphSync = CompletableFuture.runAsync(() -> {
            try {
                matchingProfileService.syncUserProfileToGraph(userId);
            } catch (Exception e) {
                log.error("Neo4j 그래프 동기화 실패: userId={}, error={}", userId, e.getMessage());
            }
        });

        CompletableFuture<Void> embeddingSync = CompletableFuture.runAsync(() -> {
            try {
                userEmbeddingService.updateEmbedding(userId);
            } catch (Exception e) {
                log.error("임베딩 업데이트 실패: userId={}, error={}", userId, e.getMessage());
            }
        });

        CompletableFuture.allOf(graphSync, embeddingSync).join();
        log.info("Neo4j 동기화 완료: userId={}", userId);
    }
}