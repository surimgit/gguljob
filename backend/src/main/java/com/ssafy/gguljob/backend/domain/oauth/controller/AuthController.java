package com.ssafy.gguljob.backend.domain.oauth.controller;

import com.ssafy.gguljob.backend.domain.oauth.dto.TokenRequestDto;
import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.auth.JwtTokenProvider;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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

    @Value("${spring.security.oauth2.client.registration.github.client-id}")
    private String githubClientId;

    @Operation(summary = "깃허브 소셜 로그인 연동", description = "깃허브 로그인 창(http://localhost:8080/api/v1/auth/github)으로 강제 이동(Redirect) 시킵니다.")
    @SecurityRequirements()
    @GetMapping("/github")
    public void redirectToGithub(HttpServletResponse response) throws IOException {
        // 깃허브 로그인 공식 URL로 리다이렉트
        String githubLoginUrl = "https://github.com/login/oauth/authorize?client_id=" + githubClientId;
        response.sendRedirect(githubLoginUrl);
    }

    @Value("${app.frontend.redirect-url}")
    private String frontendRedirectUrl;

    @Operation(summary = "깃허브 로그인 콜백", description = "깃허브에서 인가 코드를 받아와 JWT 토큰을 발급합니다.")
    @SecurityRequirements()
    @GetMapping("/github/callback")
    public void githubCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        log.info("깃허브에서 받아온 인가 코드: {}", code);

        TokenResponseDto tokenDto = githubOAuthService.loginWithGithub(code);

        String redirectUri = String.format("%s?accessToken=%s&refreshToken=%s&isNewUser=%b",
            frontendRedirectUrl, tokenDto.getAccessToken(), tokenDto.getRefreshToken(), tokenDto.isNewUser());

        response.sendRedirect(redirectUri);
    }

    @Operation(summary = "[개발용] 프리패스 로그인", description = "테스트할 때 깃허브 안 거치고 강제로 토큰을 뱉어줍니다. (실서버 배포 전 삭제하기)")
    @GetMapping("/test-login")
    public ResponseEntity<ApiResponseDto<TokenResponseDto>> testLogin(
        @Parameter(description = "테스트할 유저 ID (기본값 1)")
        @RequestParam(defaultValue = "1") Long userId) {

        String testAccessToken = jwtTokenProvider.createAccessToken(userId, "ROLE_USER");
        String testRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        redisService.setValues("RT:" + userId, testRefreshToken, java.time.Duration.ofDays(14));

        TokenResponseDto tokenDto = new TokenResponseDto(testAccessToken, testRefreshToken, false);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "백도어 로그인 성공", tokenDto));
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

    @Operation(summary = "토큰 재발급 (Refresh)", description = "만료된 AccessToken을 대체하기 위해 유효한 RefreshToken을 보내 새 토큰 세트를 발급받습니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "토큰 재발급 성공",
            content = @Content(schema = @Schema(implementation = TokenResponseDto.class))),
        @ApiResponse(responseCode = "400", description = "Redis에 토큰이 없거나 정보가 일치하지 않음 (재로그인 필요)",
            content = @Content(schema = @Schema(example = "{\"status\": 400, \"message\": \"토큰 정보가 일치하지 않거나 로그아웃된 유저입니다.\", \"data\": null}")))
    })
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponseDto<TokenResponseDto>> refresh(@RequestBody TokenRequestDto requestDto) {

        // 1. Refresh Token 자체가 정상인지 검증
        if (!jwtTokenProvider.validateToken(requestDto.getRefreshToken())) {
            throw new RuntimeException("Refresh Token이 유효하지 않습니다.");
        }

        // 2. 토큰에서 유저 ID 꺼내기
        Long userId = jwtTokenProvider.getUserIdFromToken(requestDto.getRefreshToken());

        // 3. Redis에서 우리가 저장해둔 토큰 가져오기
        String redisRefreshToken = redisService.getValues("RT:" + userId);

        // 4. 레디스에 없거나, 프론트가 준 거랑 다르면
        if (redisRefreshToken == null || !redisRefreshToken.equals(requestDto.getRefreshToken())) {
            throw new RuntimeException("토큰 정보가 일치하지 않거나 로그아웃된 유저입니다.");
        }

        // 5. 검증 통과
        String newAccessToken = jwtTokenProvider.createAccessToken(userId, "ROLE_USER");
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        // 6. Redis에 새 Refresh Token으로 덮어쓰기
        redisService.setValues("RT:" + userId, newRefreshToken, java.time.Duration.ofDays(14));

        TokenResponseDto newTokenDto = new TokenResponseDto(newAccessToken, newRefreshToken, false);
        ApiResponseDto<TokenResponseDto> response = new ApiResponseDto<>(200, "토큰 갱신", newTokenDto);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "로그아웃", description = "현재 사용 중인 AccessToken을 블랙리스트에 등록하고, Redis의 RefreshToken을 삭제하여 로그아웃 처리합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "로그아웃 성공",
            content = @Content(schema = @Schema(example = "{\"status\": 200, \"message\": \"로그아웃 성공\", \"data\": null}"))),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자 (이미 로그아웃 되었거나 만료된 토큰)",
            content = @Content(schema = @Schema(example = "{\"status\": 401, \"message\": \"인증에 실패했습니다.\", \"data\": null}")))
    })
    @PostMapping("/logout")
    public ResponseEntity<ApiResponseDto<Void>> logout(@AuthenticationPrincipal CustomUserDetails userDetails, HttpServletRequest request) {
        String accessToken = resolveToken(request);

        redisService.deleteValues("RT:" + userDetails.getId());

        if(accessToken != null) {
            Long expiration = jwtTokenProvider.getExpiration(accessToken);
            redisService.setValues(accessToken, "logout", java.time.Duration.ofMillis(expiration));
        }
        return ResponseEntity.ok(new ApiResponseDto<>(200, "로그아웃 성공", null));
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}