package com.ssafy.gguljob.backend.domain.notification.event;

import com.ssafy.gguljob.backend.domain.join.event.JoinRequestEvent;
import com.ssafy.gguljob.backend.domain.notification.entity.Notification;
import com.ssafy.gguljob.backend.domain.notification.repository.NotificationRepository;
import com.ssafy.gguljob.backend.domain.notification.service.SseEmitterService;
import com.ssafy.gguljob.backend.domain.notification.type.ActionStatus;
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
    private final SseEmitterService sseEmitterService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleJoinRequestEvent(JoinRequestEvent event) {
        log.info("합류/초대 알림 수신: 대상자 ID = {}, 카테고리 = {}, 내용 = {}",
                event.getTargetUserId(), event.getCategory(), event.getMessage());

        NotificationCategory category = switch (event.getCategory()) {
            case "JOIN_INVITE" -> NotificationCategory.TEAM_INVITE;
            case "JOIN_APPLY"  -> NotificationCategory.TEAM_APPLY;
            case "JOIN_ACCEPT" -> NotificationCategory.TEAM_ACCEPTED;
            case "JOIN_REJECT" -> NotificationCategory.TEAM_REJECTED;
            default            -> NotificationCategory.TEAM_INVITE;
        };

        ActionStatus actionStatus = (category == NotificationCategory.TEAM_INVITE
                || category == NotificationCategory.TEAM_APPLY)
                ? ActionStatus.PENDING : ActionStatus.NONE;

        userRepository.findById(event.getTargetUserId()).ifPresent(user -> {
            Notification notification = Notification.builder()
                .user(user)
                .category(category)
                .content(event.getMessage())
                .referenceId(event.getRequestId())
                .referenceUrl("/my-projects/" + event.getProjectId())
                .actionStatus(actionStatus)
                .build();

            notificationRepository.save(notification);

            // SSE 실시간 알림 발송
            long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
            sseEmitterService.notifyUser(user.getId(), notification.getId(),
                category.name(), event.getMessage(), unreadCount);
        });
    }
}
