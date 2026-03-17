package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.github.type.PrStatus;
import java.time.LocalDateTime;

public record PrItem(
    Long prId,
    Integer prNumber,
    String title,
    PrStatus status,
    LocalDateTime githubCreatedAt,
    LocalDateTime githubClosedAt
) {}