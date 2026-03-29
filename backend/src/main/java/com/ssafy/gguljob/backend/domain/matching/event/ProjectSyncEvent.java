package com.ssafy.gguljob.backend.domain.matching.event;

/**
 * delete=true 이면 Neo4j에서 해당 프로젝트 노드를 삭제.
 * delete=false 이면 RDB 최신 상태를 읽어 Neo4j에 동기화.
 *
 * 생성/수정 시: ProjectSyncEvent.sync(id)
 * 삭제 시:     ProjectSyncEvent.delete(id)
 */
public record ProjectSyncEvent(Long id, boolean delete) {

    public static ProjectSyncEvent sync(Long id) {
        return new ProjectSyncEvent(id, false);
    }

    public static ProjectSyncEvent delete(Long id) {
        return new ProjectSyncEvent(id, true);
    }
}
