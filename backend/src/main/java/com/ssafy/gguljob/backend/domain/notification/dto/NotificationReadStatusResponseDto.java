package com.ssafy.gguljob.backend.domain.notification.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationReadStatusResponseDto {
    private Long notificationId;
    private Boolean isRead;
}