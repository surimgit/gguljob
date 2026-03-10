package com.ssafy.gguljob.backend.global.api;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
@Schema(name = "ErrorResponse", description = "표준 에러 응답 포맷")
public class ErrorResponse {

    @Schema(description = "표준 에러 코드", example = "ERR_VALIDATION")
    private String code;

    @Schema(description = "에러 메시지", example = "요청 값이 올바르지 않습니다.")
    private String message;

    @Schema(description = "필드 단위 에러 목록")
    private List<FieldError> errors;

    @Getter
    @AllArgsConstructor
    @Schema(name = "ErrorFieldError", description = "필드 단위 오류 정보")
    public static class FieldError {
        private String field;
        private String reason;
    }

    public static ErrorResponse of(ErrorCode ec, String message) {
        return new ErrorResponse(ec.code(), message, null);
    }

    public static ErrorResponse of(ErrorCode ec, String message, List<FieldError> errors) {
        return new ErrorResponse(ec.code(), message, errors);
    }
}