package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class ProjectRequest {
    // 프로젝트 생성 요청
    public record Create(
        @NotBlank(message = "프로젝트 제목은 필수입니다.")
        String title,
        String teamName,
        String domain,
        String description,
        Boolean isPublic,
        String imageUrl,
        String documentUrl,
        @NotNull(message = "리더의 포지션(역할)은 필수입니다.")
        PositionType leaderRole
    ) {}

    // repoUrl 등록 요청
    public record RegisterGitRepo(
        @NotBlank(message = "레포지토리 URL은 필수입니다.")
        @Pattern(
            regexp = "^https://github\\.com/.+",
            message = "올바른 GitHub URL 형식이 아닙니다."
        )
        String repoUrl,

        @NotBlank(message = "GitHub Token은 필수입니다.")
        String githubToken
    ) {}
}
