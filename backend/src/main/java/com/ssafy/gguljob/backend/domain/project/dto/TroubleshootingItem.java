package com.ssafy.gguljob.backend.domain.project.dto;

import java.time.LocalDateTime;

public record TroubleshootingItem(
    Long tsId,
    String title,
    String situation,
    String solution,
    String code_snippet,
    String prId,
    String prNum,
    String prTitle,
    LocalDateTime createdAt
) {}