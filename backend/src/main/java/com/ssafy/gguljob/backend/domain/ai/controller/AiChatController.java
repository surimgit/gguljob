package com.ssafy.gguljob.backend.domain.ai.controller;

import com.ssafy.gguljob.backend.domain.ai.dto.ChatRequest;
import com.ssafy.gguljob.backend.domain.ai.dto.ChatResponse;
import com.ssafy.gguljob.backend.domain.ai.service.AiChatService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping("/chat/trouble")
    public ResponseEntity<ChatResponse.ChatMessageResponse> saveMcpLog(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody ChatRequest.ChatMessageRequest request){

        ChatResponse.ChatMessageResponse response = mcpService.processAndSaveChat(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
