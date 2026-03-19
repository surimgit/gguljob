package com.ssafy.gguljob.backend.domain.ai.controller;

import com.ssafy.gguljob.backend.domain.ai.dto.AiTopicDto;
import com.ssafy.gguljob.backend.domain.ai.dto.ChatRequest;
import com.ssafy.gguljob.backend.domain.ai.dto.ChatResponse;
import com.ssafy.gguljob.backend.domain.ai.service.AiChatService;
import com.ssafy.gguljob.backend.domain.ai.service.AiRecommendationService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "Ai Chat", description = "트러블 슈팅 AI 대화 API")
public class AiChatController {

    private final AiChatService mcpService;
    private final AiRecommendationService aiRecommendationService;

    @Operation(summary = "트러블 슈팅 대화", description = "AI 서버에 트러블 슈팅 관련 질문을 보내고 응답을 받습니다.")
    @PostMapping("/chat/trouble")
    public ResponseEntity<ChatResponse.ChatMessageResponse> saveMcpLog(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody ChatRequest.ChatMessageRequest request){

        ChatResponse.ChatMessageResponse response = mcpService.processAndSaveChat(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "AI 프로젝트 주제 추천", description = "도메인과 키워드(선택)를 기반으로 4개의 프로젝트 주제를 추천받습니다.")
    @PostMapping("/projects/{projectId}/topics/recommend")
    public ResponseEntity<AiTopicDto.RecommendResponse> recommendTopics(
        @PathVariable("projectId") Long projectId,
        @RequestBody(required = false) AiTopicDto.RecommendRequest request) {

        if (request == null) {
            request = new AiTopicDto.RecommendRequest(null);
        }

        AiTopicDto.RecommendResponse response = aiRecommendationService.recommendTopics(projectId, request);
        return ResponseEntity.ok(response);
    }
}
