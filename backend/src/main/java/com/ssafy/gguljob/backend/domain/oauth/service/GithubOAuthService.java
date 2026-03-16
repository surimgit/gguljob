package com.ssafy.gguljob.backend.domain.oauth.service;

import com.ssafy.gguljob.backend.domain.oauth.dto.GithubUserInfo;
import com.ssafy.gguljob.backend.domain.oauth.dto.TokenResponseDto;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.domain.user.type.RoleType;
import com.ssafy.gguljob.backend.global.auth.JwtTokenProvider;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubOAuthService {

    private final RestTemplate restTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final com.ssafy.gguljob.backend.global.redis.RedisService redisService;

    @Value("${spring.security.oauth2.client.registration.github.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.github.client-secret}")
    private String clientSecret;

    public TokenResponseDto loginWithGithub(String code) {
        String githubAccessToken = getGithubAccessToken(code);

        GithubUserInfo userInfo = getGithubUserInfo(githubAccessToken);

        String email = userInfo.getEmail();

        // 이메일이 비공개일 경우 가짜 이메일 생성
        if(email == null) {
            email = userInfo.getLogin() + "@github.com";
        }

        String finalEmail = email;


        String nameToSave = userInfo.getName() != null ? userInfo.getName() : userInfo.getLogin();
        if (nameToSave.length() > 20) {
            nameToSave = nameToSave.substring(0, 20);
        }

        String finalName = nameToSave;

        boolean isNewUser = false; // 뉴비 판독기 초기화
        User user;

        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(finalEmail);

        if (existingUserOpt.isPresent()) {
            log.info("기존 회원 로그인: 깃허브 최신 프로필로 동기화합니다. 이메일: {}", finalEmail);
            user = existingUserOpt.get();
            user.updateGithubProfile(finalName, userInfo.getAvatar_url());
            user = userRepository.save(user);
        } else {
            log.info("DB에 새 회원 정보를 저장합니다. 이메일: {}", finalEmail);
            isNewUser = true; //

            User newUser = User.builder()
                .email(finalEmail)
                .userName(finalName)
                .profileImageUrl(userInfo.getAvatar_url())
                .authority(RoleType.ROLE_USER)
                .build();
            user = userRepository.save(newUser);
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getAuthority().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        redisService.setValues("RT:" + user.getId(), refreshToken, java.time.Duration.ofDays(14));

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

        return (String) response.getBody().get("access_token");
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