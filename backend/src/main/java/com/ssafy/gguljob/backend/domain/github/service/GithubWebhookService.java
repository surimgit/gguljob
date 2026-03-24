package com.ssafy.gguljob.backend.domain.github.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.entity.PrReview;
import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PrReviewRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.type.PrStatus;
import com.ssafy.gguljob.backend.domain.notification.service.NotificationService;
import com.ssafy.gguljob.backend.domain.notification.type.NotificationCategory;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.util.List;
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
    private final PrReviewRepository prReviewRepository;
    private final GithubSyncService githubSyncService;
    private final NotificationService notificationService;

    @Async("webhookExecutor")
    @Transactional
    public void processWebhookAsync(String signature, String rawPayload) {
        try {
            JsonNode payloadNode = objectMapper.readTree(rawPayload);
            GitRepository gitRepo = resolveAndVerifyRepo(payloadNode, signature);
            handlePullRequestEvent(payloadNode, gitRepo);
        } catch (Exception e) {
            log.error("❌ 웹훅 처리 중 에러 발생: {}", e.getMessage());
            throw new RuntimeException("Webhook processing failed", e);
        }
    }

    /**
     * push 이벤트 처리 - README.md 변경 실시간 감지
     * commits 배열의 modified / added 목록을 검사하여 README 변경 시에만 동작
     */
    @Async("webhookExecutor")
    @Transactional
    public void processPushWebhookAsync(String signature, String rawPayload) {
        try {
            JsonNode payloadNode = objectMapper.readTree(rawPayload);
            GitRepository gitRepo = resolveAndVerifyRepo(payloadNode, signature);
            handlePushEvent(payloadNode, gitRepo);
        } catch (Exception e) {
            log.error("❌ Push 웹훅 처리 중 에러 발생: {}", e.getMessage());
            throw new RuntimeException("Push Webhook processing failed", e);
        }
    }

    /**
     * push 이벤트 핸들러 - README.md 실시간 변경 감지
     * commits 배열을 순회하여 modified 또는 added 목록에 README.md 가 포함된 경우에만 동작
     */
    private void handlePushEvent(JsonNode payloadNode, GitRepository gitRepo) {
        JsonNode commits = payloadNode.path("commits");

        if (!commits.isArray() || commits.isEmpty()) {
            log.info("⏭️ Push 이벤트에 처리할 커밋이 없습니다.");
            return;
        }

        // commits 배열을 순회하며 README 변경 여부 확인
        boolean isReadmeChanged = false;
        for (JsonNode commit : commits) {
            if (isReadmeModified(commit)) {
                isReadmeChanged = true;
                break;
            }
        }

        if (!isReadmeChanged) {
            log.info("⏭️ Push 이벤트에 README.md 변경 없음. 스킵합니다.");
            return;
        }

        log.info("📄 README.md 변경 감지! 레포: {}", gitRepo.getRepoUrl());

        String[] urlParts = gitRepo.getRepoUrl()
            .replace("https://github.com/", "").split("/");
        String owner = urlParts[0];
        String repo  = urlParts[1];

        String newReadme = githubSyncService.fetchReadmeFromGithub(owner, repo, null);

        Project project = gitRepo.getProject();
        project.updateReadme(newReadme);

        log.info("✅ Project README 업데이트 완료 (Project ID: {})", project.getId());
    }

    /**
     * 단일 커밋 노드에서 README.md 변경 여부를 확인하는 헬퍼
     * modified(수정) 또는 added(신규 추가) 파일 목록을 모두 검사
     */
    private boolean isReadmeModified(JsonNode commitNode) {
        for (String field : List.of("modified", "added")) {
            JsonNode files = commitNode.path(field);
            if (files.isArray()) {
                for (JsonNode file : files) {
                    if ("README.md".equalsIgnoreCase(file.asText())) {
                        return true;
                    }
                }
            }
        }
        return false;
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
                    String diffUrl = prNode.path("html_url").asText();

                    String diffContent = githubSyncService.fetchDiffFromGithub(diffUrl);

                    PullRequest newPr = PullRequest.builder()
                        .project(gitRepo.getProject())
                        .gitRepository(gitRepo)
                        .prNumber(prNumber)
                        .title(prNode.path("title").asText())
                        .diffUrl(prNode.path("html_url").asText())
                        .diffContent(diffContent)
                        .diffSummary(prNode.path("body").asText())
                        .branchName(branchName)
                        .status(prStatus)
                        .githubCreatedAt(githubCreatedAt)
                        .user(author)
                        .build();
                    pullRequestRepository.save(newPr);
                    log.info("✅ 새로운 PR 등록 완료 (PR: {})", prNumber);

                    notificationService.createNotification(
                        author,
                        NotificationCategory.GITHUB,
                        "PR #" + prNumber + " \"" + prNode.path("title").asText() + "\" 이(가) 등록되었습니다.",
                        newPr.getId(),
                        prNode.path("html_url").asText()
                    );
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

                    String closedMsg = isMerged ? "Merged" : "Closed";
                    notificationService.createNotification(
                        author,
                        NotificationCategory.GITHUB,
                        "PR #" + prNumber + " 이(가) " + closedMsg + " 처리되었습니다.",
                        existingPr.getId(),
                        existingPr.getDiffUrl()
                    );
                }
                break;
        }
    }

    @Async("webhookExecutor")
    @Transactional
    public void processIssueCommentWebhookAsync(String signature, String rawPayload) {
        try {
            JsonNode payloadNode = objectMapper.readTree(rawPayload);
            GitRepository gitRepo = resolveAndVerifyRepo(payloadNode, signature);
            handleIssueCommentEvent(payloadNode, gitRepo);
        } catch (Exception e) {
            log.error("❌ Issue 코멘트 웹훅 처리 중 에러 발생: {}", e.getMessage());
            throw new RuntimeException("Issue Comment Webhook processing failed", e);
        }
    }

    private void handleIssueCommentEvent(JsonNode payloadNode, GitRepository gitRepo) {
        // created 액션만 처리
        if (!"created".equals(payloadNode.path("action").asText())) {
            log.info("⏭️ 처리하지 않는 issue_comment 액션 패스");
            return;
        }

        // issue_comment는 일반 Issue에도 발생 → pull_request 필드로 PR 댓글 여부 필터링
        if (payloadNode.path("issue").path("pull_request").isMissingNode()) {
            log.info("⏭️ PR이 아닌 일반 Issue 댓글 스킵");
            return;
        }

        Integer prNumber = payloadNode.path("issue").path("number").asInt();
        JsonNode commentNode = payloadNode.path("comment");

        PullRequest pullRequest = pullRequestRepository
            .findByGitRepository_IdAndPrNumber(gitRepo.getId(), prNumber).orElse(null);
        if (pullRequest == null) {
            log.warn("⚠️ 댓글 대상 PR을 찾을 수 없습니다. (PR: {})", prNumber);
            return;
        }

        User commenter = resolveUser(commentNode.path("user").path("login").asText());
        if (commenter == null) return;

        prReviewRepository.save(PrReview.builder()
            .pullRequest(pullRequest)
            .user(commenter)
            .comment(commentNode.path("body").asText(null))
            .build());

        log.info("✅ PR 댓글 저장 완료 (PR: {})", prNumber);
    }

    /**
     * payload에서 레포 URL을 추출하고, DB 조회 + 서명 검증을 일괄 처리하는 공통 메서드
     * 기존에 processWebhookAsync 안에 인라인으로 있던 로직을 재사용 가능하도록 추출
     */
    private GitRepository resolveAndVerifyRepo(JsonNode payloadNode, String signature) throws Exception {
        String repoUrl = payloadNode.path("repository").path("html_url").asText();
        GitRepository gitRepo = gitRepositoryRepository.findByRepoUrl(repoUrl)
            .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 레포지토리의 웹훅입니다: " + repoUrl));
        verifySignature(payloadNode.toString(), signature, gitRepo.getWebhookSecret());
        return gitRepo;
    }

    /**
     * GitHub 로그인명으로 DB 유저를 조회하는 공통 메서드
     * 미가입자의 이벤트는 warn 로그 후 null 반환
     */
    private User resolveUser(String githubLogin) {
        String targetEmail = githubLogin + "@github.com";
        User user = userRepository.findByEmail(targetEmail).orElse(null);
        if (user == null) {
            log.warn("DB에 없는 유저의 이벤트입니다. 무시합니다. (username: {})", githubLogin);
        }
        return user;
    }
}