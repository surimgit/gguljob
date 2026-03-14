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

    @Operation(summary = "프로젝트 합류 요청", description = "특정 프로젝트에 합류(지원) 요청을 보냅니다.")
    @PostMapping("/{projectId}/join")
    public ResponseEntity<ApiResponseDto<Void>> submitJoinRequest(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @Valid @RequestBody JoinSubmitRequestDto requestDto) {

        log.info("프로젝트 합류 요청 API 호출 - 유저 ID: {}, 프로젝트 ID: {}", userDetails.getId(), projectId);

        joinRequestService.submitJoinRequest(userDetails.getId(), projectId, requestDto);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "프로젝트 합류 요청이 완료되었습니다.", null));
    }
}
