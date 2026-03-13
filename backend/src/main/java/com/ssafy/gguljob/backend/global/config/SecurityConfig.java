package com.ssafy.gguljob.backend.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.ssafy.gguljob.backend.global.auth.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // 인증 없이 허용할 경로 목록
    private static final String[] PUBLIC_URLS = {
            // 헬스체크
            "/api/v1/health",
            // Swagger UI
            "/swagger-ui.html", "/swagger-ui/**",
            "/api-docs/**", "/v3/api-docs/**",
            // TODO: 로그인/회원가입 완성 후 아래 경로 추가
            // "/api/v1/auth/**",
            "/api/v1/auth/github",
            "/api/v1/auth/github/callback",
            "/api/v1/auth/test-login",
            "/api/v1/github/webhook",
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // REST API → CSRF 불필요
                .csrf(AbstractHttpConfigurer::disable)
                // JWT 사용 → 세션 미사용
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(PUBLIC_URLS).permitAll()
                        // TODO: 인증 구현 전까지 임시 전체 허용
                        // 인증 완성 후 아래 줄 제거하고 .anyRequest().authenticated() 로 교체
                        // .anyRequest().permitAll())
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
