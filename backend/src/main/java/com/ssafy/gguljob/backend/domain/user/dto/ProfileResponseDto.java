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
    private List<String> roles;
    private String experience;
    private String mbti;
    private String teamTendency;
    private List<SkillDto> skills;
    private List<RepProjectDto> repProjects;

    @Getter
    @Builder
    public static class SkillDto {
        private String name;
        private String category;
        private String iconUrl;
    }

    @Getter
    @Builder
    public static class RepProjectDto {
        private Long projectId;
        private String title;
        private String description;
        private String role;
        private String period;
        private List<String> skills;
    }
}