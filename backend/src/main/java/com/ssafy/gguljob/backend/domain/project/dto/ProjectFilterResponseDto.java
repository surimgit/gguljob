package com.ssafy.gguljob.backend.domain.project.dto;

import java.util.List;

public record ProjectFilterResponseDto(
    List<FilterOptionDto> domains,
    List<FilterOptionDto> roles,
    List<SkillCategoryDto> skillCategories
) {
    public record FilterOptionDto(String value, String label) {}

    public record SkillCategoryDto(String category, List<SkillDto> skills) {}

    public record SkillDto(Long skillId, String name) {}
}