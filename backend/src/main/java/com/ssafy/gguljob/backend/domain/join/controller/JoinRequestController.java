package com.ssafy.gguljob.backend.domain.join.controller;

import com.ssafy.gguljob.backend.domain.join.dto.InviteUserRequestDto;
import com.ssafy.gguljob.backend.domain.join.dto.JoinSubmitRequestDto;
import com.ssafy.gguljob.backend.domain.join.service.JoinRequestService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Join Request", description = "프로젝트 합류 요청 관련 API")
public class JoinRequestController {
    private final JoinRequestService joinRequestService;

    // 프로젝트 참여 신청
    @Operation(summary = "프로젝트 참여 신청", description = "사용자가 특정 프로젝트의 포지션에 지원합니다.")
    @PostMapping("/{projectId}/positions/{positionId}/apply")
    public ResponseEntity<ApiResponseDto<Void>> applyProject(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @PathVariable Long positionId,
        @RequestBody(required = false) JoinSubmitRequestDto requestDto) {

        String appealContent = (requestDto != null) ? requestDto.getAppealContent() : null;
        joinRequestService.applyProject(userDetails.getId(), projectId, positionId, appealContent);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "프로젝트 참여 신청이 완료되었습니다.", null));
    }

    // 프로젝트 팀원 초대
    @Operation(summary = "팀원 초대", description = "프로젝트 리더가 다른 사용자를 프로젝트에 초대합니다.")
    @PostMapping("/{projectId}/invites/{userId}")
    public ResponseEntity<ApiResponseDto<Void>> inviteUser(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @PathVariable("userId") Long targetUserId,
        @RequestBody InviteUserRequestDto requestDto) {

        joinRequestService.inviteUser(userDetails.getId(), projectId, targetUserId, requestDto.getRole(), requestDto.getAppealContent());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "사용자 초대 요청이 전송되었습니다.", null));
    }

    // 프로젝트 참여/초대 수락
    @Operation(summary = "프로젝트 참여/초대 수락", description = "팀 리더가 지원을 수락하거나, 유저가 팀 초대를 수락합니다.")
    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<ApiResponseDto<Void>> acceptJoinRequest(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long requestId) {

        joinRequestService.acceptRequest(userDetails.getId(), requestId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "요청이 처리(수락)되었습니다.", null));
    }

    // 프로젝트 참여/초대 거절
    @Operation(summary = "프로젝트 참여/초대 거절", description = "팀 리더가 지원을 거절하거나, 유저가 팀 초대를 거절합니다.")
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<ApiResponseDto<Void>> rejectJoinRequest(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long requestId) {

        joinRequestService.rejectRequest(userDetails.getId(), requestId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "요청이 처리(거절)되었습니다.", null));
    }

    // 프로젝트 지원/초대 취소
    @Operation(summary = "프로젝트 지원/초대 취소", description = "지원자가 본인의 지원을 취소하거나, 리더가 초대를 취소합니다.")
    @DeleteMapping("/requests/{requestId}/cancel")
    public ResponseEntity<ApiResponseDto<Void>> cancelJoinRequest(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long requestId) {

        joinRequestService.cancelRequest(userDetails.getId(), requestId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "요청이 취소되었습니다.", null));
    }
}
