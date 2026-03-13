package com.ssafy.gguljob.backend.domain.github.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.type.PrStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubWebhookService {

    private final ObjectMapper objectMapper;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;

    @Async("webhookExecutor")
    @Transactional
    public void processWebhookAsync(String signature, String rawPayload) {
        try {
            JsonNode payloadNode = objectMapper.readTree(rawPayload);
            String repoUrl = payloadNode.path("repository").path("html_url").asText();

            // 레포 확인
            GitRepository gitRepo = gitRepositoryRepository.findByRepoUrl(repoUrl)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 레포지토리의 웹훅입니다: " + repoUrl));

            // 보안 서명 검증 (HMAC SHA-256)
            //verifySignature(rawPayload, signature, gitRepo.getWebhookSecret());

            handlePullRequestEvent(payloadNode, gitRepo);

        } catch (Exception e) {
            log.error("❌ 웹훅 처리 중 에러 발생: {}", e.getMessage());
            throw new RuntimeException("Webhook processing failed", e);
        }
    }

    //  HMAC 서명 검증 로직
    private void verifySignature(String payload, String signature, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);

        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        String expectedSignature = "sha256=" + HexFormat.of().formatHex(hash);

        if (!MessageDigest.isEqual(expectedSignature.getBytes(), signature.getBytes())) {
            throw new SecurityException("웹훅 서명(Signature) 검증 실패! 변조된 데이터입니다.");
        }
        log.info("✅ 웹훅 보안 서명 검증 통과");
    }

    private void handlePullRequestEvent(JsonNode payloadNode, GitRepository gitRepo) {
        // 필요없는 PR 예외처리
        String action = payloadNode.path("action").asText();
        if (!action.equals("opened") && !action.equals("edited") &&
            !action.equals("closed") && !action.equals("reopened")) {
            log.info("⏭️ 처리하지 않는 PR 액션 패스 (Action: {})", action);
            return;
        }

        JsonNode prNode = payloadNode.path("pull_request");
        Integer prNumber = prNode.path("number").asInt();

        log.info("🚀 PR 이벤트 수신 - Action: {}, PR Number: {}", action, prNumber);

        // 작성자 매칭
        String githubUsername = prNode.path("user").path("login").asText();
        String targetEmail = githubUsername + "@github.com";
        User author = userRepository.findByEmail(targetEmail).orElse(null);
        if (author == null) {
            log.warn("DB에 없는 유저의 PR 이벤트입니다. 무시합니다. (username: {})", githubUsername);
            return;
        }

        PullRequest existingPr = pullRequestRepository.findByGitRepository_IdAndPrNumber(gitRepo.getId(), prNumber).orElse(null);

        // Action에 따른 분기 처리
        processAction(action, prNode, prNumber, gitRepo, author, existingPr);
    }

    private void processAction(String action, JsonNode prNode, Integer prNumber,
        GitRepository gitRepo, User author, PullRequest existingPr) {

        switch (action) {
            case "opened":
                if (existingPr == null) {
                    LocalDateTime githubCreatedAt = ZonedDateTime.parse(prNode.path("created_at").asText()).toLocalDateTime();
                    String branchName = prNode.path("head").path("ref").asText();
                    PrStatus prStatus = PrStatus.valueOf(prNode.path("state").asText().toUpperCase());

                    PullRequest newPr = PullRequest.builder()
                        .project(gitRepo.getProject())
                        .gitRepository(gitRepo)
                        .prNumber(prNumber)
                        .title(prNode.path("title").asText())
                        .diffUrl(prNode.path("html_url").asText())
                        .diffSummary(prNode.path("body").asText())
                        .branchName(branchName)
                        .status(prStatus)
                        .githubCreatedAt(githubCreatedAt)
                        .user(author)
                        .build();
                    pullRequestRepository.save(newPr);
                    log.info("✅ 새로운 PR 등록 완료 (PR: {})", prNumber);
                }
                break;

            case "edited":
            case "reopened":
                if (existingPr != null) {
                    PrStatus prStatus = PrStatus.valueOf(prNode.path("state").asText().toUpperCase());
                    String updatedTitle = prNode.path("title").asText();
                    String updatedBody = prNode.path("body").asText();

                    existingPr.updatePrInfo(prStatus, updatedTitle, updatedBody);
                    log.info("✅ 기존 PR 정보 업데이트 완료 (PR: {}, 상태: {})", prNumber, prStatus);
                }
                break;

            case "closed":
                if (existingPr != null) {
                    boolean isMerged = prNode.path("merged").asBoolean();
                    PrStatus finalStatus = isMerged ? PrStatus.MERGED : PrStatus.CLOSED;

                    String closedAtStr = prNode.path("closed_at").asText();
                    LocalDateTime closedAt = null;
                    if (closedAtStr != null && !closedAtStr.equals("null") && !closedAtStr.isEmpty()) {
                        closedAt = ZonedDateTime.parse(closedAtStr).toLocalDateTime();
                    }

                    existingPr.updateStatus(finalStatus, closedAt);
                    log.info("✅ PR 닫힘 처리 완료 (PR: {}, 최종 상태: {}, 닫힌 시간: {})", prNumber, finalStatus, closedAt);
                }
                break;
        }
    }
}