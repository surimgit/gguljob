package com.ssafy.gguljob.backend.domain.user.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProfileResponseDto {
    private Long userId;
    private String email;
    private String userName;
    private String imageUrl;
    private String description;
    private String position;
    private String experience;
    private String mbti;
    private String teamTendency;
    private List<SkillDto> skills;

    @Getter
    @Builder
    public static class SkillDto {
        private String name;
        private String category;
        private String iconUrl;
    }
}