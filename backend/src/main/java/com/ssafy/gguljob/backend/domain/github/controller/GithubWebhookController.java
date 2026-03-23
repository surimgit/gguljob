package com.ssafy.gguljob.backend.domain.github.controller;

import com.ssafy.gguljob.backend.domain.github.service.GithubWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GithubWebhookController {

    private final GithubWebhookService githubWebhookService;

    @PostMapping("/webhook")
    public ResponseEntity<String> receiveWebhook(
        @RequestHeader("X-GitHub-Event") String eventType,
        @RequestHeader("X-Hub-Signature-256") String signature,
        @RequestBody String rawPayload
    ) {
        log.info("🔔 깃허브 웹훅 수신: Event Type = {}", eventType);

        // Ping 테스트
        if ("ping".equals(eventType)) {
            return ResponseEntity.ok("pong");
        }

        switch (eventType) {
            case "ping" ->
                ResponseEntity.ok("pong");

            case "pull_request" ->
                githubWebhookService.processWebhookAsync(signature, rawPayload);

            case "issue_comment" ->
                githubWebhookService.processIssueCommentWebhookAsync(signature, rawPayload);

            // push 이벤트 - README 변경 감지용
            case "push" ->
                githubWebhookService.processPushWebhookAsync(signature, rawPayload);

            default ->
                log.info("⏭️ 처리하지 않는 이벤트 타입 패스 (Event: {})", eventType);
        }

        return ResponseEntity.ok("Webhook processed successfully");
    }
}