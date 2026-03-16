package com.ssafy.gguljob.backend.domain.notification.controller;

import com.ssafy.gguljob.backend.domain.notification.dto.NotificationResponseDto;
import com.ssafy.gguljob.backend.domain.notification.service.NotificationService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "알림 API", description = "알림 조회 및 관리 API")
public class NotificationController {
    private final NotificationService notificationService;

    @Operation(summary = "내 알림 목록 조회", description = "내 알림을 최신순으로 조회합니다. (무한 스크롤 지원)")
    @GetMapping
    public ResponseEntity<ApiResponseDto<Page<NotificationResponseDto>>> getMyNotifications(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @ParameterObject @PageableDefault(size = 10) Pageable pageable) {

        Page<NotificationResponseDto> response = notificationService.getMyNotifications(userDetails.getId(), pageable);
        return ResponseEntity.ok(new ApiResponseDto<>(200, "알림 목록 조회 성공", response));
    }
}