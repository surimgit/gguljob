package com.ssafy.gguljob.backend.domain.matching.event;

import com.ssafy.gguljob.backend.domain.matching.service.Neo4jProjectSyncBatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectSyncEventListener {

    private final Neo4jProjectSyncBatchService neo4jProjectSyncBatchService;

    /** 프로젝트 RDB 삭제 시: Neo4j 노드도 즉시 삭제 */
    @EventListener
    public void handleProjectDelete(ProjectSyncEvent event) {
        if (!event.delete()) return;
        try {
            log.info("Neo4j 프로젝트 노드 삭제 이벤트: projectId={}", event.id());
            neo4jProjectSyncBatchService.deleteProjectNode(event.id());
        } catch (Exception e) {
            log.error("Neo4j 프로젝트 노드 삭제 실패 (projectId={}): {}", event.id(), e.getMessage(), e);
        }
    }

    /** 생성/수정/상태변경: RDB 커밋 이후 최신 상태로 Neo4j 동기화 (노드는 절대 삭제하지 않음) */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProjectSync(ProjectSyncEvent event) {
        if (event.delete()) return;
        try {
            log.info("Neo4j 동기화 이벤트 수신 (AFTER_COMMIT): 프로젝트 ID [{}]", event.id());
            neo4jProjectSyncBatchService.syncProjectNode(event.id());
        } catch (Exception e) {
            log.error("Neo4j 동기화 실패 (projectId={}): {}", event.id(), e.getMessage(), e);
        }
    }
}
