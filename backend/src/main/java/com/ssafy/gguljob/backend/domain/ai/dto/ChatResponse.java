package com.ssafy.gguljob.backend.domain.ai.dto;

public class ChatResponse{
    public record ChatMessageResponse(
    String aiAnswer
    ) {}

    public record AiServerResponse(
        String answer
    ) {}
}