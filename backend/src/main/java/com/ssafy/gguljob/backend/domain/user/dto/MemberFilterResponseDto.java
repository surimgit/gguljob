package com.ssafy.gguljob.backend.domain.user.dto;

import java.util.List;

public record MemberFilterResponseDto(
    List<FilterOptionDto> positions,
    List<FilterOptionDto> experienceLevels
) {
    public record FilterOptionDto(String value, String label) {}
}