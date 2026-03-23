package com.ssafy.gguljob.backend.domain.join.event;

import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class JoinRequestEvent {
    private final Long targetUserId; // 알림을 받을 사람 (지원자 or 프로젝트 리더)
    private final Long projectId;    // 관련된 프로젝트 ID
    private final Long requestId;    // 초대장 ID
    private final String message;    // 알림 내용
    private final String category;   // 알림 카테고리 (예: "JOIN_ACCEPT", "JOIN_REJECT")

    private final LocalDateTime createdAt;

    public JoinRequestEvent(Long targetUserId, Long projectId, Long requestId, String message, String category) {
        this.targetUserId = targetUserId;
        this.projectId = projectId;
        this.requestId = requestId;
        this.message = message;
        this.category = category;
        this.createdAt = LocalDateTime.now();
    }

    // 테스트 및 외부 주입을 고려한 오버로딩 생성자
    public JoinRequestEvent(Long targetUserId, Long projectId, Long requestId, String message, String category, LocalDateTime createdAt) {
        this.targetUserId = targetUserId;
        this.projectId = projectId;
        this.requestId = requestId;
        this.message = message;
        this.category = category;
        this.createdAt = createdAt;
    }
}