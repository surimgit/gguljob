package com.ssafy.gguljob.backend.domain.oauth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
public class GithubUserInfo {
    private String id;         // 깃허브 고유 식별 번호
    private String email;      // 유저 이메일
    private String name;       // 유저 실명
    private String login;      // 깃허브 닉네임
    private String avatar_url; // 프로필 사진 URL
}
