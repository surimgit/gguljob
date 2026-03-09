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
}