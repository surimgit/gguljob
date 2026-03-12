package com.ssafy.gguljob.backend.domain.project.dto;

public record InitialPrSyncEvent(
    Long repoId,
    Long projectId,
    String repoUrl,
    String githubToken,
    String webhookSecret
) {}