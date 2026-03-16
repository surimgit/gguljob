package com.ssafy.gguljob.backend.domain.notification.service;

import com.ssafy.gguljob.backend.domain.notification.dto.NotificationResponseDto;
import com.ssafy.gguljob.backend.domain.notification.entity.Notification;
import com.ssafy.gguljob.backend.domain.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getMyNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findAllByUserIdOrderByIsReadAscCreatedAtDesc(userId, pageable)
            .map(NotificationResponseDto::from);
    }

    // 특정 알림 읽음 처리
    @Transactional
    public void readNotification(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));

        // 남의 알림 읽음 처리하는 해킹 방지
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 알림만 읽음 처리할 수 있습니다.");
        }

        notification.markAsRead(); // JPA 더티 체킹으로 자동 UPDATE
    }
}
