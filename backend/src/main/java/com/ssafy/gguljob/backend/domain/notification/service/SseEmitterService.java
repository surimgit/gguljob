package com.ssafy.gguljob.backend.domain.notification.service;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
public class SseEmitterService {

    private static final long SSE_TIMEOUT = 60 * 60 * 1000L; // 1시간
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        // 기존 연결이 있으면 정리
        SseEmitter old = emitters.remove(userId);
        if (old != null) {
            old.complete();
        }

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError(e -> emitters.remove(userId));

        // 연결 직후 더미 이벤트 (503 방지)
        try {
            emitter.send(SseEmitter.event()
                .name("connect")
                .data("connected"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    public void sendToUser(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) return;

        try {
            emitter.send(SseEmitter.event()
                .name(eventName)
                .data(data));
        } catch (IOException e) {
            emitters.remove(userId);
            log.debug("SSE send failed for user {}, removing emitter", userId);
        }
    }

    /**
     * 알림 생성 후 해당 유저에게 SSE 이벤트 발송.
     * 알림 생성 경로(NotificationService, NotificationEventListener)에서 공통 사용.
     */
    public void notifyUser(Long userId, Long notificationId, String category,
                           String content, long unreadCount) {
        sendToUser(userId, "notification", Map.of(
            "notificationId", notificationId,
            "category", category,
            "content", content,
            "unreadCount", unreadCount
        ));
    }
}
