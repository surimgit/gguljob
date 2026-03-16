package com.ssafy.gguljob.backend.domain.ai.dto;

public class ChatRequest {
    public record ChatMessageRequest(
        Long projectId,
        String userMessage
    ) {}

    public record AiServerRequest(
        String message
    ) {}
}
