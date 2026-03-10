package com.ssafy.project.backend.global.api;

import com.ssafy.project.backend.global.exception.BadRequestException;
import com.ssafy.project.backend.global.exception.DuplicateResourceException;
import com.ssafy.project.backend.global.exception.ForbiddenException;
import com.ssafy.project.backend.global.exception.ResourceNotFoundException;
import com.ssafy.project.backend.global.exception.UnAuthorizedException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Arrays;
import java.util.List;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final Environment environment;

    // 공통 응답 생성 헬퍼 메서드
    private ResponseEntity<ErrorResponse> buildErrorResponse(ErrorCode ec, String message, List<ErrorResponse.FieldError> errors) {
        return ResponseEntity.status(ec.status()).body(ErrorResponse.of(ec, message, errors));
    }

    // 커스텀 비즈니스 예외 처리

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException e) {
        return buildErrorResponse(GlobalErrorCode.ERR_VALIDATION, e.getMessage(), null);
    }

    @ExceptionHandler(UnAuthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnAuthorized(UnAuthorizedException e) {
        return buildErrorResponse(GlobalErrorCode.ERR_UNAUTHORIZED, e.getMessage(), null);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException e) {
        return buildErrorResponse(GlobalErrorCode.ERR_FORBIDDEN, e.getMessage(), null);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException e) {
        return buildErrorResponse(GlobalErrorCode.ERR_NOT_FOUND, e.getMessage(), null);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException e) {
        return buildErrorResponse(GlobalErrorCode.ERR_CONFLICT, e.getMessage(), null);
    }

    // 기존에 세팅했던 시스템 예외 낚아채기

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException e) {
        return buildErrorResponse(e.getErrorCode(), e.getMessage(), e.getErrors());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        ErrorCode ec = GlobalErrorCode.ERR_VALIDATION;
        return buildErrorResponse(ec, safeMessage(e.getMessage(), ec.defaultMessage()), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        ErrorCode ec = GlobalErrorCode.ERR_VALIDATION;
        List<ErrorResponse.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> new ErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
            .toList();
        return buildErrorResponse(ec, ec.defaultMessage(), errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnknown(Exception e) {
        ErrorCode ec = GlobalErrorCode.ERR_INTERNAL;
        log.error("Unhandled exception", e);
        String msg = isProdProfile() ? ec.defaultMessage() : safeMessage(e.getMessage(), ec.defaultMessage());
        return buildErrorResponse(ec, msg, null);
    }

    // 유틸 메서드

    private boolean isProdProfile() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }

    private String safeMessage(String message, String fallback) {
        return (message == null || message.isBlank()) ? fallback : message;
    }
}