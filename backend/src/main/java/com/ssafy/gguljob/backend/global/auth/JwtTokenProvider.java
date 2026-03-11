package com.ssafy.gguljob.backend.global.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private SecretKey secretKey;

    /**
     * 의존성 주입이 완료된 후, yml에서 가져온 평문 비밀키를 암호화용 SecretKey 객체로 변환
     */
    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 1. Access Token 생성
     * 유저 식별자(ID)와 권한(Role)을 담아서 짧은 수명의 팔찌를 만듦
     */
    public String createAccessToken(Long userId, String role) {
        long now = System.currentTimeMillis();
        long expirationTime = jwtProperties.getAccessMinutes() * 60 * 1000L;

        return Jwts.builder()
            .subject(String.valueOf(userId))      // payload "sub": "1"
            .claim("role", role)                  // payload "role": "USER"
            .issuedAt(new Date(now))              // 발행 시간
            .expiration(new Date(now + expirationTime)) // 만료 시간
            .signWith(secretKey)                  // 암호화 서명
            .compact();
    }

    /**
     * 2. Refresh Token 생성
     * 권한 정보 없이 유저 식별자만 담아서 긴 수명의 예비용 팔찌를 만듦
     */
    public String createRefreshToken(Long userId) {
        long now = System.currentTimeMillis();
        long expirationTime = jwtProperties.getRefreshDays() * 24 * 60 * 60 * 1000L;

        return Jwts.builder()
            .subject(String.valueOf(userId))
            .issuedAt(new Date(now))
            .expiration(new Date(now + expirationTime))
            .signWith(secretKey)
            .compact();
    }

    /**
     * 3. 토큰 유효성 검증
     * 가드가 이 팔찌가 위조됐는지, 기간이 지났는지 확인
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(secretKey) // 서명 검증
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.warn("🚨 잘못된 JWT 서명입니다.", e);
        } catch (ExpiredJwtException e) {
            log.warn("🚨 만료된 JWT 토큰입니다.", e);
        } catch (UnsupportedJwtException e) {
            log.warn("🚨 지원되지 않는 JWT 토큰입니다.", e);
        } catch (IllegalArgumentException e) {
            log.warn("🚨 JWT 토큰이 비어있거나 잘못되었습니다.", e);
        }
        return false;
    }

    /**
     * 4. 토큰에서 유저 ID(subject) 추출
     * 팔찌가 유효하다면, 팔찌에 적혀있는 유저 번호를 읽어옴
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload(); // JJWT 0.12.x 최신 문법 (getBody() 아님!)

        return Long.parseLong(claims.getSubject());
    }

    /**
     * 5. 토큰에서 유저 권한(role) 추출
     * 팔찌에 적힌 등급(ROLE_USER, ROLE_ADMIN 등)을 읽어옴
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();

        // 토큰 생성할 때 "role"이라는 이름으로 넣었던 값을 그대로 빼옵니다.
        return claims.get("role", String.class);
    }

    public Long getExpiration(String token) {
        Date expiration = Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getExpiration();

        long now = new Date().getTime();
        return (expiration.getTime() - now);
    }
}