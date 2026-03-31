package com.ssafy.gguljob.backend.domain.matching.dto;

public record MemberMatchResultDto(
    String userId,
    Integer graphScore
) {}