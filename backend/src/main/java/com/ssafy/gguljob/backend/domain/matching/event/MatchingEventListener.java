package com.ssafy.gguljob.backend.domain.matching.event;

import com.ssafy.gguljob.backend.domain.job.service.JobRecommendationService;
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
    private final JobRecommendationService jobRecommendationService;

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

        // 캐시 워밍업: Neo4j 동기화 + 임베딩 완료 후 새 결과로 캐시 채워두기
        try {
            jobRecommendationService.getAllJobsWithScoring(userId);
            log.info("추천 캐시 워밍업 완료: userId={}", userId);
        } catch (Exception e) {
            log.error("추천 캐시 워밍업 실패: userId={}, error={}", userId, e.getMessage(), e);
        }
    }
}