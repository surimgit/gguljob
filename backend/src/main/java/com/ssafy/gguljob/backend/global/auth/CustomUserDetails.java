package com.ssafy.gguljob.backend.global.auth;

import com.ssafy.gguljob.backend.domain.user.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    public Long getId() {
        return user.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 권한 리턴 (단일 권한 기준)
        return Collections.singletonList(new SimpleGrantedAuthority(user.getAuthority().getKey()));
    }

    @Override
    public String getPassword() {
        return null; // 소셜 로그인이니 비밀번호는 없음
    }

    @Override
    public String getUsername() {
        return String.valueOf(user.getId()); // 시큐리티 규격상 식별자를 리턴 (여기서는 userId)
    }

    // 아래 4개는 계정 만료/잠김 여부인데, 지금은 다 true(정상)로 둡니다.
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}