package com.ssafy.gguljob.backend.domain.user.controller;

import com.ssafy.gguljob.backend.domain.user.dto.OnboardingRequestDto;
import com.ssafy.gguljob.backend.domain.user.service.UserService;
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
        @Valid @RequestBody OnboardingRequestDto requestDto) {

        log.info("온보딩 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        userService.onboardUser(userDetails.getId(), requestDto);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "온보딩 정보 등록 완료", null));
    }

    @Operation(summary = "회원 탈퇴", description = "유저 본인의 계정과 연관된 모든 데이터를 삭제하고 탈퇴합니다.")
    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponseDto<Void>> withdraw(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("회원 탈퇴 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        userService.withdrawUser(userDetails.getId());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "회원 탈퇴가 정상적으로 처리되었습니다.", null));
    }
}
