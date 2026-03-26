package com.ssafy.gguljob.backend.domain.oauth.service;

import com.ssafy.gguljob.backend.domain.oauth.dto.GithubUserInfo;
import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.domain.user.type.RoleType;
import com.ssafy.gguljob.backend.global.auth.JwtProperties;
import com.ssafy.gguljob.backend.global.auth.JwtTokenProvider;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import com.ssafy.gguljob.backend.global.exception.UnAuthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubOAuthService {

    private final RestTemplate restTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final UserRepository userRepository;
    private final com.ssafy.gguljob.backend.global.redis.RedisService redisService;

    @Value("${spring.security.oauth2.client.registration.github.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.github.client-secret}")
    private String clientSecret;

    @Transactional
    public TokenResponseDto loginWithGithub(String code) {
        String githubAccessToken = getGithubAccessToken(code);

        GithubUserInfo userInfo = getGithubUserInfo(githubAccessToken);

        String email = userInfo.getEmail();

        // 이메일이 비공개일 경우 /user/emails API로 실제 이메일 조회
        if (email == null) {
            email = getGithubPrimaryEmail(githubAccessToken);
        }

        String finalEmail = email;
        String githubNickname = userInfo.getLogin();

        String nameToSave = userInfo.getName() != null ? userInfo.getName() : githubNickname;
        if (nameToSave.length() > 20) {
            nameToSave = nameToSave.substring(0, 20);
        }

        String finalName = nameToSave;

        boolean isNewUser = false; // 뉴비 판독기 초기화
        User user;

        // 1순위: 깃허브 닉네임으로 기존 회원 조회 (가짜 이메일 유저도 매칭됨)
        java.util.Optional<User> existingUserOpt = userRepository.findByGithubNickname(githubNickname);

        // 2순위: 닉네임으로 못 찾으면 이메일로 조회 (닉네임 컬럼 추가 전 가입 유저 대응)
        if (existingUserOpt.isEmpty() && finalEmail != null) {
            existingUserOpt = userRepository.findByEmail(finalEmail);
        }

        if (existingUserOpt.isPresent()) {
            log.info("기존 회원 로그인: 깃허브 최신 프로필로 동기화합니다. 닉네임: {}", githubNickname);
            user = existingUserOpt.get();
            user.updateGithubProfile(finalName, githubNickname, userInfo.getAvatar_url());
            // 실제 이메일로 동기화 (가짜 이메일 → 진짜 이메일 교체)
            if (finalEmail != null && !finalEmail.equals(user.getEmail())) {
                log.info("이메일 동기화: {} → {}", user.getEmail(), finalEmail);
                user.setEmail(finalEmail);
            }
            user = userRepository.save(user);
        } else {
            log.info("DB에 새 회원 정보를 저장합니다. 이메일: {}", finalEmail);
            isNewUser = true;

            User newUser = User.builder()
                .email(finalEmail)
                .userName(finalName)
                .githubNickname(githubNickname)
                .profileImageUrl(userInfo.getAvatar_url())
                .authority(RoleType.ROLE_USER)
                .build();
            user = userRepository.save(newUser);
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getAuthority().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        redisService.setValues("RT:" + user.getId(), refreshToken, java.time.Duration.ofDays(jwtProperties.getRefreshDays()));

        log.info("JWT 토큰 발급 성공");

        return new TokenResponseDto(accessToken, refreshToken, isNewUser);
    }

    /**
     * 인가 코드를 깃허브 토큰으로 교환
     */
    private String getGithubAccessToken(String code) {
        String tokenUrl = "https://github.com/login/oauth/access_token";

        // HTTP 헤더 세팅
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json");

        // HTTP 바디 세팅
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

        Map<String, Object> body = response.getBody();
        if (body == null || body.containsKey("error")) {
            String errorDesc = body != null ? (String) body.get("error_description") : "unknown";
            log.error("GitHub 토큰 발급 실패: {}", errorDesc);
            throw new UnAuthorizedException("GitHub 인증에 실패했습니다: " + errorDesc);
        }

        return (String) body.get("access_token");
    }

    /**
     * 깃허브 /user/emails API로 primary 이메일 조회
     */
    private String getGithubPrimaryEmail(String accessToken) {
        String emailUrl = "https://api.github.com/user/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
            emailUrl, HttpMethod.GET, request,
            new ParameterizedTypeReference<List<Map<String, Object>>>() {});

        List<Map<String, Object>> emails = response.getBody();
        if (emails == null || emails.isEmpty()) {
            log.warn("GitHub /user/emails API에서 이메일을 가져올 수 없습니다.");
            return null;
        }

        // primary + verified 이메일 우선
        for (Map<String, Object> e : emails) {
            if (Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified"))) {
                return (String) e.get("email");
            }
        }

        // primary만이라도
        for (Map<String, Object> e : emails) {
            if (Boolean.TRUE.equals(e.get("primary"))) {
                return (String) e.get("email");
            }
        }

        // 아무거나라도
        return (String) emails.get(0).get("email");
    }

    /**
     * 깃허브 토큰으로 유저 정보 조회
     */
    private GithubUserInfo getGithubUserInfo(String accessToken) {
        String userInfoUrl = "https://api.github.com/user";

        // 1. HTTP 헤더 세팅: 발급받은 깃허브 토큰을 Bearer 방식으로 달아줌
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);

        // 2. 요청 객체 만들기
        HttpEntity<String> request = new HttpEntity<>(headers);

        // 3. 깃허브로 GET
        ResponseEntity<GithubUserInfo> response = restTemplate.exchange(
            userInfoUrl, HttpMethod.GET, request, GithubUserInfo.class);

        return response.getBody();
    }
}