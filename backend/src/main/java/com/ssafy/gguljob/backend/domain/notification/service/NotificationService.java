package com.ssafy.gguljob.backend.domain.notification.service;

import com.ssafy.gguljob.backend.domain.notification.dto.NotificationResponseDto;
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
}
