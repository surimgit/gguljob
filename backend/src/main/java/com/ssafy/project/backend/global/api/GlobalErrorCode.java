package com.ssafy.project.backend.global.api;

import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@RequiredArgsConstructor
@Schema(description = "전역 API 표준 에러 코드 목록")
public enum GlobalErrorCode implements ErrorCode {

    ERR_VALIDATION(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    ERR_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증 실패 / 토큰 만료"),
    ERR_FORBIDDEN(HttpStatus.FORBIDDEN, "권한 없음"),
    ERR_NOT_FOUND(HttpStatus.NOT_FOUND, "대상 없음"),
    ERR_CONFLICT(HttpStatus.CONFLICT, "데이터 충돌 / 중복 발생"),
    ERR_INTERNAL(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류 발생");

    private final HttpStatus status;
    private final String defaultMessage;

    @Override
    public HttpStatus status() { return status; }

    @Override
    public String defaultMessage() { return defaultMessage; }

    @Override
    public String code() { return name(); }
}