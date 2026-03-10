package com.ssafy.gguljob.backend.global.api;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(name = "ApiResponse", description = "모든 REST API의 공통 성공 응답 포맷")
public class ApiResponse<T> {

    public static final String SUCCESS_CODE = "SUCCESS";
    public static final String SUCCESS_MESSAGE = "OK";

    @Schema(description = "응답 코드", example = "SUCCESS")
    private String code;

    @Schema(description = "응답 메시지", example = "OK")
    private String message;

    @Schema(description = "API별 실제 응답 payload")
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(SUCCESS_CODE, SUCCESS_MESSAGE, data);
    }
}