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

        if ("pull_request".equals(eventType)) {
            githubWebhookService.processWebhookAsync(signature, rawPayload);
        }

        return ResponseEntity.ok("Webhook processed successfully");
    }
}