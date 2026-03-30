package com.ssafy.gguljob.backend.domain.join.type;

public enum JoinRequestStatus {
    PENDING,   // 대기중
    ACCEPTED,  // 수락됨
    REJECTED,  // 거절됨
    CANCELED  // 취소됨
}