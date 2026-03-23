package com.ssafy.gguljob.backend.global.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// 403 에러
@ResponseStatus(HttpStatus.FORBIDDEN)
public class NotificationAccessDeniedException extends RuntimeException {
    public NotificationAccessDeniedException() {
        super("본인의 알림만 접근할 수 있습니다.");
    }
}