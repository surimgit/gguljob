package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProjectRequest {
    // 1. 프로젝트 생성 요청
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
}
