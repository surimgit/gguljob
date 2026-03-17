package com.ssafy.gguljob.backend.domain.notification.event;

import com.ssafy.gguljob.backend.domain.join.event.JoinRequestEvent;
import com.ssafy.gguljob.backend.domain.notification.entity.Notification;
import com.ssafy.gguljob.backend.domain.notification.repository.NotificationRepository;
import com.ssafy.gguljob.backend.domain.notification.type.NotificationCategory;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleJoinRequestEvent(JoinRequestEvent event) {
        log.info("합류/초대 알림 수신: 대상자 ID = {}, 내용 = {}", event.getTargetUserId(), event.getMessage());

        userRepository.findById(event.getTargetUserId()).ifPresent(user -> {
            Notification notification = Notification.builder()
                .user(user)
                .category(NotificationCategory.TEAM)
                .content(event.getMessage())
                .referenceId(event.getProjectId())
                .referenceUrl("/projects/" + event.getProjectId())
                .build();

            notificationRepository.save(notification);
        });
    }
}
