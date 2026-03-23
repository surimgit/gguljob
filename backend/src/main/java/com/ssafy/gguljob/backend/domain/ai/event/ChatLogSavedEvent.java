package com.ssafy.gguljob.backend.domain.ai.event;

public record ChatLogSavedEvent(
    Long chatLogId,
    Long projectId,
    Long prId,      // nullable
    String content
) {}