package com.ssafy.gguljob.backend.domain.notification.dto;

import com.ssafy.gguljob.backend.domain.notification.entity.Notification;
import com.ssafy.gguljob.backend.domain.notification.type.ActionStatus;
import com.ssafy.gguljob.backend.domain.notification.type.NotificationCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponseDto {
    private Long notificationId;
    private NotificationCategory category;
    private String content;
    private Long referenceId;
    private String referenceUrl;
    private Boolean isRead;
    private ActionStatus actionStatus;
    private LocalDateTime createdAt;

    public static NotificationResponseDto from(Notification notification) {
        return NotificationResponseDto.builder()
            .notificationId(notification.getId())
            .category(notification.getCategory())
            .content(notification.getContent())
            .referenceId(notification.getReferenceId())
            .referenceUrl(notification.getReferenceUrl())
            .isRead(notification.getIsRead())
            .actionStatus(notification.getActionStatus())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}