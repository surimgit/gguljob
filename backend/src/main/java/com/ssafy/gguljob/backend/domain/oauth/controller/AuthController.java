package com.ssafy.gguljob.backend.domain.oauth.controller;

import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import com.ssafy.gguljob.backend.global.auth.CookieUtil;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.auth.JwtTokenProvider;
import com.ssafy.gguljob.backend.global.auth.JwtProperties;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import com.ssafy.gguljob.backend.global.exception.UnAuthorizedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import com.ssafy.gguljob.backend.global.redis.RedisService;
import com.ssafy.gguljob.backend.domain.oauth.service.GithubOAuthService;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증/인가 및 소셜 로그인 API")
public class AuthController {

        private final GithubOAuthService githubOAuthService;
        private final RedisService redisService;
        private final JwtTokenProvider jwtTokenProvider;
        private final JwtProperties jwtProperties;
        private final UserRepository userRepository;
        private final Environment environment;

        @Value("${spring.security.oauth2.client.registration.github.client-id}")
        private String githubClientId;

        @Value("${app.frontend.redirect-url}")
        private String frontendRedirectUrl;

        /**
         * local 프로파일이면 secure=false (HTTP 환경), 그 외에는 secure=true (HTTPS 환경)
         */
        private boolean isSecureCookie() {
                return !Arrays.asList(environment.getActiveProfiles()).contains("local");
        }

        @Operation(summary = "깃허브 소셜 로그인 연동",
                        description = "깃허브 로그인 창으로 강제 이동(Redirect) 시킵니다.")
        @SecurityRequirements()
        @GetMapping("/github")
        public void redirectToGithub(HttpServletResponse response) throws IOException {
                String githubLoginUrl = "https://github.com/login/oauth/authorize?client_id="
                                + githubClientId;
                response.sendRedirect(githubLoginUrl);
        }

        @Operation(summary = "깃허브 로그인 콜백", description = "깃허브에서 인가 코드를 받아와 JWT 토큰을 HttpOnly 쿠키로 발급합니다.")
        @SecurityRequirements()
        @GetMapping("/github/callback")
        public void githubCallback(@RequestParam(value = "code", required = false) String code,
                        @RequestParam(value = "error", required = false) String error,
                        @RequestParam(value = "error_description",
                                        required = false) String errorDescription,
                        HttpServletResponse response) throws IOException {

                if (error != null) {
                        log.warn("GitHub 로그인 취소: {}", errorDescription);
                        response.sendRedirect(frontendRedirectUrl + "?error=access_denied");
                        return;
                }

                if (code == null) {
                        log.error("GitHub 인가 코드가 존재하지 않습니다.");
                        response.sendRedirect(frontendRedirectUrl + "?error=no_code");
                        return;
                }

                log.info("깃허브에서 받아온 인가 코드: {}", code);

                try {
                        TokenResponseDto tokenDto = githubOAuthService.loginWithGithub(code);

                        // 토큰을 HttpOnly 쿠키로 세팅
                        long accessMaxAge = jwtProperties.getAccessMinutes() * 60L;
                        long refreshMaxAge = jwtProperties.getRefreshDays() * 24L * 60L * 60L;
                        boolean secure = isSecureCookie();
                        CookieUtil.addAccessTokenCookie(response, tokenDto.getAccessToken(), accessMaxAge, secure);
                        CookieUtil.addRefreshTokenCookie(response, tokenDto.getRefreshToken(), refreshMaxAge, secure);

                        // isNewUser만 쿼리 파라미터로 전달 (토큰은 쿠키로)
                        String redirectUri = String.format("%s?isNewUser=%b",
                                        frontendRedirectUrl, tokenDto.isNewUser());

                        response.sendRedirect(redirectUri);
                } catch (UnAuthorizedException e) {
                        log.error("GitHub 로그인 처리 중 인증 오류: {}", e.getMessage());
                        response.sendRedirect(frontendRedirectUrl + "?error=auth_failed");
                } catch (Exception e) {
                        log.error("GitHub 콜백 처리 중 예상치 못한 오류: {}", e.getMessage(), e);
                        response.sendRedirect(frontendRedirectUrl + "?error=server_error");
                }
        }

        @Operation(summary = "[개발용] 프리패스 로그인",
                        description = "깃허브 안 거치고 강제로 토큰을 쿠키로 발급합니다.")
        @GetMapping("/test-login")
        public ResponseEntity<ApiResponseDto<Map<String, Object>>> testLogin(
                        @Parameter(description = "테스트할 유저 ID (기본값 1)") @RequestParam(
                                        name = "userId", defaultValue = "1") Long userId,
                        HttpServletResponse response) {

                String testAccessToken = jwtTokenProvider.createAccessToken(userId, "ROLE_USER");
                String testRefreshToken = jwtTokenProvider.createRefreshToken(userId);

                redisService.setValues("RT:" + userId, testRefreshToken,
                                java.time.Duration.ofDays(jwtProperties.getRefreshDays()));

                long accessMaxAge = jwtProperties.getAccessMinutes() * 60L;
                long refreshMaxAge = jwtProperties.getRefreshDays() * 24L * 60L * 60L;
                boolean secure = isSecureCookie();
                CookieUtil.addAccessTokenCookie(response, testAccessToken, accessMaxAge, secure);
                CookieUtil.addRefreshTokenCookie(response, testRefreshToken, refreshMaxAge, secure);

                Map<String, Object> data = new HashMap<>();
                data.put("userId", userId);
                data.put("isNewUser", false);

                return ResponseEntity.ok(new ApiResponseDto<>(200, "백도어 로그인 성공", data));
        }

        @Operation(summary = "현재 로그인한 유저 ID 조회(테스트용)",
                        description = "발급받은 AccessToken을 검증하고 유저의 핵심 정보를 반환합니다.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "인증 성공 및 유저 정보 조회 완료",
                                        content = @Content(schema = @Schema(
                                                        implementation = ApiResponseDto.class))),
                        @ApiResponse(responseCode = "401",
                                        description = "유효하지 않거나 만료된 토큰입니다. (재로그인 필요)",
                                        content = @Content(schema = @Schema(
                                                        example = "{\"status\": 401, \"message\": \"인증에 실패했습니다.\", \"data\": null}"))),
                        @ApiResponse(responseCode = "404", description = "존재하지 않는 탈퇴한 유저입니다.",
                                        content = @Content(schema = @Schema(
                                                        example = "{\"status\": 404, \"message\": \"유저를 찾을 수 없습니다.\", \"data\": null}")))})
        @GetMapping("/me")
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

        @Operation(summary = "토큰 재발급 (Refresh)",
                        description = "쿠키의 RefreshToken으로 새 토큰 세트를 HttpOnly 쿠키로 재발급합니다.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "토큰 재발급 성공"),
                        @ApiResponse(responseCode = "401",
                                        description = "Refresh Token이 유효하지 않거나 만료됨 (재로그인 필요)")})
        @PostMapping("/refresh")
        public ResponseEntity<ApiResponseDto<Void>> refresh(
                        HttpServletRequest request,
                        HttpServletResponse response) {

                // 1. 쿠키에서 Refresh Token 추출
                String refreshToken = CookieUtil.resolveTokenFromCookie(request, CookieUtil.REFRESH_TOKEN_COOKIE);
                if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
                        throw new UnAuthorizedException("Refresh Token이 유효하지 않습니다.");
                }

                // 2. 토큰에서 유저 ID 꺼내기
                Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

                // 3. Redis에서 저장해둔 토큰 가져오기
                String redisRefreshToken = redisService.getValues("RT:" + userId);

                // 4. 레디스에 없거나, 쿠키에서 온 거랑 다르면
                if (redisRefreshToken == null || !redisRefreshToken.equals(refreshToken)) {
                        throw new UnAuthorizedException("토큰 정보가 일치하지 않거나 로그아웃된 유저입니다.");
                }

                // 5. DB에서 최신 role 조회 후 새 토큰 발급
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 유저입니다."));
                String newAccessToken = jwtTokenProvider.createAccessToken(userId, user.getAuthority().name());
                String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

                // 6. Redis에 새 Refresh Token으로 덮어쓰기
                redisService.setValues("RT:" + userId, newRefreshToken,
                                java.time.Duration.ofDays(jwtProperties.getRefreshDays()));

                // 7. 새 토큰을 쿠키로 세팅
                long accessMaxAge = jwtProperties.getAccessMinutes() * 60L;
                long refreshMaxAge = jwtProperties.getRefreshDays() * 24L * 60L * 60L;
                boolean secure = isSecureCookie();
                CookieUtil.addAccessTokenCookie(response, newAccessToken, accessMaxAge, secure);
                CookieUtil.addRefreshTokenCookie(response, newRefreshToken, refreshMaxAge, secure);

                return ResponseEntity.ok(new ApiResponseDto<>(200, "토큰 갱신 성공", null));
        }

        @Operation(summary = "로그아웃",
                        description = "AccessToken을 블랙리스트에 등록하고, 쿠키를 삭제하여 로그아웃 처리합니다. AT가 만료되어도 로그아웃 가능합니다.")
        @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "로그아웃 성공")})
        @PostMapping("/logout")
        public ResponseEntity<ApiResponseDto<Void>> logout(
                        HttpServletRequest request,
                        HttpServletResponse response) {

                String accessToken = CookieUtil.resolveTokenFromCookie(request, CookieUtil.ACCESS_TOKEN_COOKIE);
                String refreshToken = CookieUtil.resolveTokenFromCookie(request, CookieUtil.REFRESH_TOKEN_COOKIE);

                // RT에서 userId 꺼내서 Redis RT 삭제 (AT 만료돼도 RT로 식별 가능)
                if (refreshToken != null && jwtTokenProvider.validateToken(refreshToken)) {
                        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
                        redisService.deleteValues("RT:" + userId);
                }

                // AT 블랙리스트 (유효한 경우에만)
                if (accessToken != null && jwtTokenProvider.validateToken(accessToken)) {
                        Long expiration = jwtTokenProvider.getExpiration(accessToken);
                        if (expiration > 0) {
                                redisService.setValues(accessToken, "logout",
                                                java.time.Duration.ofMillis(expiration));
                        }
                }

                // 쿠키 삭제는 무조건
                boolean secure = isSecureCookie();
                CookieUtil.deleteAccessTokenCookie(response, secure);
                CookieUtil.deleteRefreshTokenCookie(response, secure);

                return ResponseEntity.ok(new ApiResponseDto<>(200, "로그아웃 성공", null));
        }
}
