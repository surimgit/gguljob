package com.ssafy.gguljob.backend.domain.matching.event;

import com.ssafy.gguljob.backend.domain.matching.service.MatchingProfileService;
import com.ssafy.gguljob.backend.domain.matching.service.UserEmbeddingService;
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
    private final UserEmbeddingService userEmbeddingService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserProfileSync(UserProfileSyncEvent event) {
        Long userId = event.userId();

        try {
            matchingProfileService.syncUserProfileToGraph(userId);
            log.info("Neo4j 그래프 동기화 완료: userId={}", userId);
        } catch (Exception e) {
            log.error("Neo4j 그래프 동기화 실패: userId={}, error={}", userId, e.getMessage(), e);
        }

        try {
            userEmbeddingService.updateEmbedding(userId);
            log.info("임베딩 업데이트 완료: userId={}", userId);
        } catch (Exception e) {
            log.error("임베딩 업데이트 실패: userId={}, error={}", userId, e.getMessage(), e);
        }
    }
}