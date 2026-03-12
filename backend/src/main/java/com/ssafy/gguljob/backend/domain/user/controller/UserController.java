package com.ssafy.gguljob.backend.domain.user.controller;

import com.ssafy.gguljob.backend.domain.user.dto.OnboardingRequestDto;
import com.ssafy.gguljob.backend.domain.user.service.UserService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "유저 프로필 및 온보딩 관련 API")
public class UserController {
    private final UserService userService;

    @Operation(summary = "초기 프로필 설정 (온보딩)", description = "최초 로그인 시 필수 추가 정보를 입력받아 저장합니다.")
    @PostMapping("/onboarding")
    public ResponseEntity<ApiResponseDto<Void>> onboard(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody OnboardingRequestDto requestDto) {

        log.info("온보딩 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        userService.onboardUser(userDetails.getId(), requestDto);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "온보딩 정보 등록 완료", null));
    }
}
