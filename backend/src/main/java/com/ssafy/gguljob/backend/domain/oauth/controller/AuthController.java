package com.ssafy.gguljob.backend.domain.oauth.controller;

import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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

    @Operation(summary = "깃허브 로그인 콜백", description = "깃허브에서 인가 코드를 받아와 JWT 토큰을 발급합니다.")
    @GetMapping("/github/callback")
    public ResponseEntity<?> githubCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        log.info("깃허브에서 받아온 인가 코드: {}", code);

        TokenResponseDto tokenDto = githubOAuthService.loginWithGithub(code);

        String frontendRedirectUrl = String.format("http://localhost:5173/oauth-success?accessToken=%s&refreshToken=%s",
            tokenDto.getAccessToken(), tokenDto.getRefreshToken());

        response.sendRedirect(frontendRedirectUrl);

        return ResponseEntity.ok("성공적으로 코드를 받았습니다");
    }
}