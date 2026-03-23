package com.ssafy.gguljob.backend.global.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "accessToken";
    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    public static void addAccessTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE, token)
            .httpOnly(true)
            .secure(secure)
            .path("/")
            .maxAge(maxAgeSeconds)
            .sameSite("Lax")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void addRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, token)
            .httpOnly(true)
            .secure(secure)
            .path("/api/v1/auth")
            .maxAge(maxAgeSeconds)
            .sameSite("Lax")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void deleteAccessTokenCookie(HttpServletResponse response, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE, "")
            .httpOnly(true)
            .secure(secure)
            .path("/")
            .maxAge(0)
            .sameSite("Lax")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void deleteRefreshTokenCookie(HttpServletResponse response, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
            .httpOnly(true)
            .secure(secure)
            .path("/api/v1/auth")
            .maxAge(0)
            .sameSite("Lax")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static String resolveTokenFromCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
