package com.ssafy.gguljob.backend.domain.oauth.controller;

import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증/인가 및 소셜 로그인 API")
public class AuthController {

    private final com.ssafy.gguljob.backend.domain.oauth.service.GithubOAuthService githubOAuthService;

    @Value("${spring.security.oauth2.client.registration.github.client-id}")
    private String githubClientId;

    @Operation(summary = "깃허브 소셜 로그인 연동", description = "깃허브 로그인 창(http://localhost:8080/api/v1/auth/github)으로 강제 이동(Redirect) 시킵니다.")
    @GetMapping("/github")
    public void redirectToGithub(HttpServletResponse response) throws IOException {
        // 깃허브 로그인 공식 URL로 리다이렉트
        String githubLoginUrl = "https://github.com/login/oauth/authorize?client_id=" + githubClientId;
        response.sendRedirect(githubLoginUrl);
    }
    @Value("${app.frontend.redirect-url}")
    private String frontendRedirectUrl;

    @Operation(summary = "깃허브 로그인 콜백", description = "깃허브에서 인가 코드를 받아와 JWT 토큰을 발급합니다.")
    @GetMapping("/github/callback")
    public void githubCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        log.info("깃허브에서 받아온 인가 코드: {}", code);

        TokenResponseDto tokenDto = githubOAuthService.loginWithGithub(code);

        String redirectUri = String.format("%s?accessToken=%s&refreshToken=%s",
            frontendRedirectUrl, tokenDto.getAccessToken(), tokenDto.getRefreshToken());

        response.sendRedirect(redirectUri);
    }

    @Operation(
        summary = "현재 로그인한 유저 ID 조회(테스트용)",
        description = "발급받은 AccessToken을 검증하고 유저의 핵심 정보를 반환합니다."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "인증 성공 및 유저 정보 조회 완료",
            content = @Content(schema = @Schema(implementation = ApiResponseDto.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "유효하지 않거나 만료된 토큰입니다. (재로그인 필요)",
            content = @Content(schema = @Schema(example = "{\"status\": 401, \"message\": \"인증에 실패했습니다.\", \"data\": null}"))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "존재하지 않는 탈퇴한 유저입니다.",
            content = @Content(schema = @Schema(example = "{\"status\": 404, \"message\": \"유저를 찾을 수 없습니다.\", \"data\": null}"))
        )
    })@GetMapping("/me")
    public ResponseEntity<ApiResponseDto<Map<String, Object>>> getMyInfo(
        @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Long userId = customUserDetails.getId();
        String userName = customUserDetails.getUser().getUserName();
        String email = customUserDetails.getUser().getEmail();

        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("userName", userName);
        data.put("email", email);

        ApiResponseDto<Map<String, Object>> response =
            new ApiResponseDto<>(200, userName + "사용자 인증 성공", data);

        return ResponseEntity.ok(response);
    }
}