package com.ssafy.project.backend.global.api;

import lombok.Getter;
import java.util.List;

@Getter
public class ApiException extends RuntimeException {
    private final ErrorCode errorCode;
    private final List<ErrorResponse.FieldError> errors;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.defaultMessage());
        this.errorCode = errorCode;
        this.errors = null;
    }

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.errors = null;
    }

    public ApiException(ErrorCode errorCode, String field, String reason) {
        super(errorCode.defaultMessage());
        this.errorCode = errorCode;
        this.errors = List.of(new ErrorResponse.FieldError(field, reason));
    }

    // MR 리뷰 반영: 여러 개의 필드 에러를 한 번에 처리할 수 있는 생성자 추가
    public ApiException(ErrorCode errorCode, String message, List<ErrorResponse.FieldError> errors) {
        super(message);
        this.errorCode = errorCode;
        this.errors = errors;
    }
}
