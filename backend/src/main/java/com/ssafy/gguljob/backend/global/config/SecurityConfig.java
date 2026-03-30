package com.ssafy.gguljob.backend.global.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.ssafy.gguljob.backend.global.auth.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.frontend.redirect-url}")
    private String frontendRedirectUrl;

    // 인증 없이 허용할 경로 목록
    private static final String[] PUBLIC_URLS = {
            // 헬스체크
            "/api/v1/health",
            // Swagger UI
            "/swagger-ui.html", "/swagger-ui/**",
            "/api-docs/**", "/v3/api-docs/**",
            "/api/v1/auth/github",
            "/api/v1/auth/github/callback",
            "/api/v1/auth/test-login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/github/webhook",
            "/api/v1/jobs/recommended/**",
            "/api/v1/admin/neo4j/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(PUBLIC_URLS).permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // frontendRedirectUrl에서 origin 추출 (예: http://localhost:5173/oauth-success → http://localhost:5173)
        String origin = extractOrigin(frontendRedirectUrl);
        config.setAllowedOrigins(List.of(origin, "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private String extractOrigin(String url) {
        try {
            java.net.URI uri = new java.net.URI(url);
            String origin = uri.getScheme() + "://" + uri.getHost();
            if (uri.getPort() != -1) {
                origin += ":" + uri.getPort();
            }
            return origin;
        } catch (Exception e) {
            return url;
        }
    }
}
