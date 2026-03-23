package com.ssafy.gguljob.backend.domain.notification.controller;

import com.ssafy.gguljob.backend.domain.notification.dto.NotificationResponseDto;
import com.ssafy.gguljob.backend.domain.notification.dto.UnreadCountResponseDto;
import com.ssafy.gguljob.backend.domain.notification.service.NotificationService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import com.ssafy.gguljob.backend.domain.notification.dto.NotificationReadStatusResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    // 특정 알림 읽음 처리
    @Operation(summary = "특정 알림 읽음 처리", description = "단일 알림을 읽음 상태로 변경합니다.")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponseDto<NotificationReadStatusResponseDto>> readNotification(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long notificationId) {

        NotificationReadStatusResponseDto responseDto = notificationService.readNotification(userDetails.getId(), notificationId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "알림이 읽음 처리되었습니다.", responseDto));
    }

    // 전체 알림 읽음 처리
    @Operation(summary = "전체 알림 읽음 처리", description = "내 모든 미확인 알림을 한 번에 읽음 상태로 변경합니다.")
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponseDto<Void>> readAllNotifications(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        notificationService.readAllNotifications(userDetails.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(200, "모든 알림이 읽음 처리되었습니다.", null));
    }

    // 특정 알림 삭제
    @Operation(summary = "특정 알림 삭제", description = "단일 알림을 삭제합니다. (알림창에서 개별 X 버튼 클릭 시)")
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponseDto<Void>> deleteNotification(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long notificationId) {

        notificationService.deleteNotification(userDetails.getId(), notificationId);
        return ResponseEntity.ok(new ApiResponseDto<>(200, "알림이 삭제되었습니다.", null));
    }

    // 전체 알림 삭제
    @Operation(summary = "전체 알림 삭제", description = "내 모든 알림을 삭제합니다. (모두 지우기 버튼 클릭 시)")
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponseDto<Void>> deleteAllNotifications(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        notificationService.deleteAllNotifications(userDetails.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(200, "모든 알림이 삭제되었습니다.", null));
    }

    // 안 읽은 알림 개수 조회
    @Operation(summary = "안 읽은 알림 개수 조회", description = "사용자의 확인하지 않은 알림 총 개수를 조회합니다. (GNB 종 모양 아이콘 뱃지용)")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponseDto<UnreadCountResponseDto>> getUnreadCount(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        UnreadCountResponseDto response = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(200, "안 읽은 알림 개수 조회 성공", response));
    }
}