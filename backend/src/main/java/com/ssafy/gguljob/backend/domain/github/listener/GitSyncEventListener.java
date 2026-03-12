package com.ssafy.gguljob.backend.domain.github.listener;

import com.ssafy.gguljob.backend.domain.github.service.GithubSyncService;
import com.ssafy.gguljob.backend.domain.project.dto.InitialPrSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class GitSyncEventListener {

    private final GithubSyncService githubSyncService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleInitialPrSync(InitialPrSyncEvent event){
        log.info("[비동기 워커] 깃 PR 초기 동기화 시작: Project ID = {}", event.projectId());
        try{
            githubSyncService.syncInitialPullRequests(event);
            log.info("[비동기 워커] 깃 PR 초기 동기화 완료: Project ID = {}", event.projectId());
        } catch (Exception e) {
            log.error("[비동기 워커] 깃 PR 초기 동기화 실패: {}", e.getMessage(), e);
        }
    }
}
