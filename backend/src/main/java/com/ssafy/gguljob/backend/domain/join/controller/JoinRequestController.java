package com.ssafy.gguljob.backend.domain.join.controller;

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
        @RequestBody JoinSubmitRequestDto requestDto) {

        joinRequestService.inviteUser(userDetails.getId(), projectId, targetUserId, requestDto.getPositionId());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "사용자 초대 요청이 전송되었습니다.", null));
    }
}
