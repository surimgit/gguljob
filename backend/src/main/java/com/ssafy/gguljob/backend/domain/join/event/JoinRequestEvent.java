package com.ssafy.gguljob.backend.domain.join.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JoinRequestEvent {
    private final Long targetUserId; // 알림을 받을 사람 (지원자 or 프로젝트 리더)
    private final Long projectId;    // 관련된 프로젝트 ID
    private final String message;    // 알림 내용
    private final String category;   // 알림 카테고리 (예: "JOIN_ACCEPT", "JOIN_REJECT")
}