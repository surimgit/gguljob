package com.ssafy.gguljob.backend.domain.matching.dto;

public record ProjectMatchResultDto(
    String projectId,
    String projectTitle,    // 프로젝트 제목
    String matchedRole,     // 나랑 겹치는 모집 직무
    Long score              // 스킬 겹친 개수 (점수)
) {
}