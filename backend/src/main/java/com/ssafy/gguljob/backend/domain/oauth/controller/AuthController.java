package com.ssafy.gguljob.backend.domain.oauth.controller;

import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import io.swagger.v3.oas.annotations.Operation;
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

    @Operation(summary = "깃허브 소셜 로그인 연동", description = "깃허브 로그인 창으로 강제 이동(Redirect) 시킵니다.")
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

    @Operation(summary = "테스트용 현재 로그인한 유저 ID 조회", description = "발급받은 AccessToken이 유효한지 테스트합니다.")
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyInfo(@AuthenticationPrincipal Long userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);

        return ResponseEntity.ok(response);
    }
}