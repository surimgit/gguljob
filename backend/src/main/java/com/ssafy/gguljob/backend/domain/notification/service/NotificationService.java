package com.ssafy.gguljob.backend.domain.notification.service;

import com.ssafy.gguljob.backend.domain.notification.dto.NotificationReadStatusResponseDto;
import com.ssafy.gguljob.backend.domain.notification.dto.NotificationResponseDto;
import com.ssafy.gguljob.backend.domain.notification.dto.UnreadCountResponseDto;
import com.ssafy.gguljob.backend.domain.notification.entity.Notification;
import com.ssafy.gguljob.backend.domain.notification.repository.NotificationRepository;
import com.ssafy.gguljob.backend.domain.notification.type.NotificationCategory;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.global.exception.NotificationAccessDeniedException;
import com.ssafy.gguljob.backend.global.exception.NotificationNotFoundException;
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
    public NotificationReadStatusResponseDto readNotification(Long userId, Long notificationId) {
        // 404 에러 처리
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(NotificationAccessDeniedException::new);

        // 403 에러 처리 (권한 없음)
        if (!notification.getUser().getId().equals(userId)) {
            throw new NotificationAccessDeniedException();
        }

        // 읽음 처리 로직 (더티 체킹)
        notification.markAsRead();

        // 변경된 상태 리턴
        return NotificationReadStatusResponseDto.builder()
            .notificationId(notification.getId())
            .isRead(notification.getIsRead())
            .build();
    }

    // 전체 알림 읽음 처리
    @Transactional
    public void readAllNotifications(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    // 특정 알림 삭제
    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        // 404 에러 처리
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(NotificationNotFoundException::new);

        // 403 에러 처리
        if (!notification.getUser().getId().equals(userId)) {
            throw new NotificationAccessDeniedException();
        }

        // 삭제 처리
        notificationRepository.delete(notification);
    }

    // 전체 알림 삭제
    @Transactional
    public void deleteAllNotifications(Long userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    // 안 읽은 알림 개수 조회
    @Transactional(readOnly = true)
    public UnreadCountResponseDto getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return new UnreadCountResponseDto(count);
    }

    @Transactional
    public Notification createNotification(User user, NotificationCategory category,
        String content, Long referenceId, String referenceUrl) {
        Notification notification = Notification.builder()
            .user(user)
            .category(category)
            .content(content)
            .referenceId(referenceId)
            .referenceUrl(referenceUrl)
            .build();
        return notificationRepository.save(notification);
    }
}
