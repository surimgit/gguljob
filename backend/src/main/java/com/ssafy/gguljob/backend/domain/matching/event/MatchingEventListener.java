package com.ssafy.gguljob.backend.domain.matching.event;

import com.ssafy.gguljob.backend.domain.matching.service.MatchingProfileService;
import com.ssafy.gguljob.backend.domain.matching.service.MatchingProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class MatchingEventListener {

    private final MatchingProfileService matchingProfileService;
    private final MatchingProjectService matchingProjectService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserProfileSync(UserProfileSyncEvent event) {
        matchingProfileService.syncUserProfileToGraph(event.userId());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProjectSync(ProjectSyncEvent event) {
        matchingProjectService.syncProjectToGraph(event.id());
    }
}