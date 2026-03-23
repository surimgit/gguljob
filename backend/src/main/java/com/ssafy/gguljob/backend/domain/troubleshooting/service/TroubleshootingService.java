package com.ssafy.gguljob.backend.domain.troubleshooting.service;

import com.ssafy.gguljob.backend.domain.ai.entity.ChatLog;
import com.ssafy.gguljob.backend.domain.ai.repository.ChatLogRepository;
import com.ssafy.gguljob.backend.domain.ai.service.AiChatService;
import com.ssafy.gguljob.backend.domain.ai.service.ChatLogVectorService;
import com.ssafy.gguljob.backend.domain.github.entity.PrReview;
import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.github.repository.PrReviewRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.service.GithubSyncService;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingRequest;
import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingResponse;
import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import com.ssafy.gguljob.backend.domain.troubleshooting.repository.TroubleshootingRepository;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TroubleshootingService {

    private final TroubleshootingRepository troubleshootingRepository;
    private final AiChatService aiChatService;
    private final ChatLogVectorService chatLogVectorService;
    private final ChatLogRepository chatLogRepository;
    private final PrReviewRepository prReviewRepository;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PullRequestRepository pullRequestRepository;
    private final GithubSyncService githubSyncService;

    private static final int MAX_DIFF_LENGTH = 3000;
    private static final int TOP_K = 5;

    public List<TroubleshootingResponse.Widget> getMyWidgetList(Long userId) {
        return troubleshootingRepository.findTop2ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(TroubleshootingResponse.Widget::from)
            .collect(Collectors.toList());
    }

    public TroubleshootingResponse.GenerateResult generateAndSaveTroubleshooting(
        Long userId, TroubleshootingRequest.GenerateFromCommit request) {

        // 이미 분석된 데이터 확인
        Optional<Troubleshooting> existingData =
            troubleshootingRepository.findByPullRequest_Id(request.prId());
        if (existingData.isPresent()) {
            Troubleshooting data = existingData.get();

            return new TroubleshootingResponse.GenerateResult(
                data.getTitle(),
                data.getSituation(),
                data.getSolution(),
                data.getCodeSnippet(),
                data.getConfidence(),
                data.getPullRequest().getTitle(),
                data.getPullRequest().getPrNumber()
            );
        }

        PullRequest pr = pullRequestRepository.findById(request.prId())
            .orElseThrow(() -> new IllegalArgumentException("해당 PR을 찾을 수 없습니다."));

        // ① Diff 데이터 가져오기
        String diffContent = fetchDiffContent(pr);
        String optimizedDiff = optimizeDiff(diffContent);

        // ② PR 기간 ChatLog 수집 + 배치 임베딩
        List<ChatLog> chatLogs = collectChatLogs(pr, request.projectId());
        chatLogVectorService.embedIfAbsent(chatLogs);

        // ③ 유사도 검색으로 관련 ChatLog만 추출
        String searchQuery = buildSearchQuery(pr, optimizedDiff);

        List<Long> relevantIds = chatLogVectorService.findSimilarChatLogIds(
            searchQuery, request.projectId(), TOP_K
        );
        List<ChatLog> relevantLogs = chatLogs.stream()
            .filter(log -> relevantIds.contains(log.getId()))
            .collect(Collectors.toList());

        log.info("📊 RAG 필터링 결과 - 전체: {}개 → 관련: {}개",
            chatLogs.size(), relevantLogs.size());

        log.info("📊 검색된 ChatLog IDs: {}",
            relevantLogs.stream()
                .map(ChatLog::getId)
                .collect(Collectors.toList()));

        if (request.prId() == 9997L) {
            evaluateRagPrecision(relevantLogs, List.of(73L, 74L, 75L, 76L, 77L, 78L, 79L));
        } else if (request.prId() == 9998L) {
            evaluateRagPrecision(relevantLogs, List.of(67L, 68L, 69L));
        } else if (request.prId() == 9999L) {
            evaluateRagPrecision(relevantLogs, List.of(53L, 54L, 55L, 56L));
        }

        // ④ PR 리뷰 코멘트 수집
        List<PrReview> reviews = prReviewRepository.findByPullRequest_Id(request.prId());

        // ⑤ 프롬프트 빌드 + AI 호출
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(pr, optimizedDiff, relevantLogs, reviews);
        String llmResponseRaw = aiChatService.callClaudeApiWithSystem(systemPrompt, userPrompt);

        try {
            String cleanJson = cleanJsonResponse(llmResponseRaw);
            log.info("정제된 JSON: {}", cleanJson);

            TroubleshootingResponse.GenerateResult resultDto =
                objectMapper.readValue(cleanJson, TroubleshootingResponse.GenerateResult.class);

            saveTroubleshootingData(userId, request, resultDto);

            return new TroubleshootingResponse.GenerateResult(
                resultDto.title(),
                resultDto.trouble(),
                resultDto.shooting(),
                resultDto.codeSnippet(),
                resultDto.confidence(),
                pr.getTitle(),
                pr.getPrNumber()
            );

        } catch (Exception e) {
            log.error("❌ 트러블슈팅 파싱 실패. 원본: {}", llmResponseRaw, e);
            throw new RuntimeException("AI 응답 파싱 중 오류가 발생했습니다.");
        }
    }

    // ──────────────────────────────────────────
    // 헬퍼 메서드들
    // ──────────────────────────────────────────

    private String fetchDiffContent(PullRequest pr) {
        String diffContent = pr.getDiffContent();
        if (diffContent != null && !diffContent.trim().isEmpty()) {
            return diffContent;
        }

        String apiUrl = pr.getDiffUrl();
        if (apiUrl.contains("github.com") && !apiUrl.contains("api.github.com")) {
            apiUrl = apiUrl.replace("github.com", "api.github.com/repos")
                .replace("/pull/", "/pulls/");
        }

        log.info("🚀 Github에서 Diff 데이터를 가져오는 중: {}", apiUrl);
        diffContent = githubSyncService.fetchDiffFromGithub(apiUrl);

        if (diffContent == null || diffContent.isBlank()) {
            throw new RuntimeException("Github에서 Diff 데이터를 가져오는 데 실패했습니다.");
        }

        pr.updateDiffContent(diffContent);
        pullRequestRepository.save(pr);
        return diffContent;
    }

    private String optimizeDiff(String rawDiff) {
        if (rawDiff.length() <= MAX_DIFF_LENGTH) return rawDiff;

        // 추가된 라인(+) 우선 보존
        String[] lines = rawDiff.split("\n");
        StringBuilder prioritized = new StringBuilder();
        StringBuilder rest = new StringBuilder();

        for (String line : lines) {
            if (line.startsWith("+") || line.startsWith("@@")
                || line.startsWith("diff")) {
                prioritized.append(line).append("\n");
            } else {
                rest.append(line).append("\n");
            }
        }

        String result = prioritized.toString();
        if (result.length() < MAX_DIFF_LENGTH) {
            int remaining = MAX_DIFF_LENGTH - result.length();
            result += rest.substring(0, Math.min(remaining, rest.length()));
        }

        return result.length() > MAX_DIFF_LENGTH
            ? result.substring(0, MAX_DIFF_LENGTH) + "\n... (truncated)"
            : result;
    }

    private List<ChatLog> collectChatLogs(PullRequest pr, Long projectId) {
        // PR에 직접 태깅된 ChatLog 우선
        List<ChatLog> tagged = chatLogRepository.findByPullRequest_Id(pr.getId());
        if (!tagged.isEmpty()) return tagged;

        // 없으면 PR 기간 기반 fallback
        LocalDateTime start = pr.getGithubCreatedAt();
        LocalDateTime end = pr.getGithubClosedAt() != null
            ? pr.getGithubClosedAt() : LocalDateTime.now();

        return chatLogRepository.findByProject_IdAndCreatedAtBetween(
            projectId, start, end
        );
    }

    private String buildSystemPrompt() {
        return """
            You are a senior software engineer with 10+ years of experience \
            in debugging and code review.
            Your task is to analyze a Pull Request and generate a structured \
            troubleshooting report in Korean.
            
            <rules>
            - Base your analysis ONLY on the provided data below
            - If developer comments or LLM conversation exist, prioritize them \
            as they reflect the developer's actual intent
            - If data is insufficient to determine root cause, explicitly state \
            what is unclear — do NOT guess or fabricate
            - Respond ONLY in valid JSON — no markdown, no explanation outside JSON
            - All field values must be written in Korean
            </rules>
            
            <output_format>
            {
              "title": "한 줄 요약 (50자 이내)",
              "trouble": "문제 상황과 원인 (2~4문장, 근거가 있는 내용만)",
              "shooting": "해결 방법과 선택 이유 (2~4문장)",
              "codeSnippet": "변경된 핵심 코드 스니펫 (10~20줄 이내, 없으면 null)",
              "confidence": "high | medium | low"
            }
            </output_format>
            
            <code_snippet_guide>
            - code_diff에서 가장 핵심적인 변경 코드만 추출
            - 메서드 단위로 잘라서 제공 (전체 클래스 X)
            - 언어에 맞는 주석 포함 가능
            - 코드가 없거나 불명확하면 null
            </code_snippet_guide>
            
            <confidence_guide>
            high   : PR 본문 또는 LLM 대화에 명확한 근거 있음
            medium : Diff로 추론 가능하나 개발자 의도 불명확
            low    : Diff만 있고 맥락 부족, 추론에 의존
            </confidence_guide>
            """;
    }

    private String buildUserPrompt(PullRequest pr, String optimizedDiff,
        List<ChatLog> relevantLogs, List<PrReview> reviews) {

        StringBuilder sb = new StringBuilder();

        // PR 제목
        sb.append("<pr_title>\n")
            .append(pr.getTitle())
            .append("\n</pr_title>\n\n");

        // PR 본문 (있을 때만)
        if (pr.getDiffSummary() != null && !pr.getDiffSummary().isBlank()) {
            sb.append("<pr_body>\n")
                .append(pr.getDiffSummary())
                .append("\n</pr_body>\n\n");
        }

        // LLM 대화 내역 (RAG로 추출된 관련 로그)
        if (!relevantLogs.isEmpty()) {
            sb.append("<llm_conversation>\n");
            sb.append("개발자가 이 PR 작업 중 AI와 나눈 대화입니다. ");
            sb.append("문제 해결 과정과 고민을 파악하는 데 활용하세요.\n\n");
            relevantLogs.forEach(log ->
                sb.append(log.getContent()).append("\n---\n")
            );
            sb.append("</llm_conversation>\n\n");
        }

        // PR 리뷰 코멘트 (있을 때만)
        if (!reviews.isEmpty()) {
            sb.append("<review_comments>\n");
            reviews.stream()
                .filter(r -> r.getComment() != null && !r.getComment().isBlank())
                .forEach(r -> sb.append(r.getComment()).append("\n---\n"));
            sb.append("</review_comments>\n\n");
        }

        // Code Diff
        sb.append("<code_diff>\n")
            .append(optimizedDiff)
            .append("\n</code_diff>\n\n");

        // 데이터 부족 시 AI에게 명시
        if (relevantLogs.isEmpty() && reviews.isEmpty()
            && (pr.getDiffSummary() == null || pr.getDiffSummary().isBlank())) {
            sb.append("<context_note>\n")
                .append("No developer comments or conversation available. ")
                .append("Analysis is based solely on code diff. ")
                .append("Set confidence to low and clearly state what is uncertain.\n")
                .append("</context_note>\n");
        }

        sb.append("Generate the troubleshooting JSON report now.");
        return sb.toString();
    }

    private String cleanJsonResponse(String raw) {
        if (raw.contains("```")) {
            return raw.replaceAll("(?s)^```(?:json)?\\s*(.*?)\\s*```$", "$1").trim();
        }
        return raw.trim();
    }

    @Transactional
    protected void saveTroubleshootingData(Long userId,
        TroubleshootingRequest.GenerateFromCommit request,
        TroubleshootingResponse.GenerateResult resultDto) {

        Troubleshooting entity = Troubleshooting.builder()
            .user(userRepository.getReferenceById(userId))
            .project(projectRepository.getReferenceById(request.projectId()))
            .pullRequest(pullRequestRepository.getReferenceById(request.prId()))
            .title(resultDto.title())
            .situation(resultDto.trouble())
            .solution(resultDto.shooting())
            .codeSnippet(resultDto.codeSnippet())
            .confidence(resultDto.confidence())
            .build();

        troubleshootingRepository.save(entity);
    }

    @Transactional
    public void updateTroubleshooting(Long userId, Long troubleshootingId,
        TroubleshootingRequest.Update request) {

        Troubleshooting troubleshooting = troubleshootingRepository
            .findById(troubleshootingId)
            .orElseThrow(() -> new IllegalArgumentException("해당 트러블슈팅을 찾을 수 없습니다."));

        if (!troubleshooting.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("트러블슈팅을 수정할 권한이 없습니다.");
        }

        troubleshooting.updateContent(
            request.title(),
            request.role(),
            request.language(),
            request.framework(),
            request.situation(),
            request.solution(),
            request.codeSnippet()
        );
    }

    private void evaluateRagPrecision(
        List<ChatLog> relevantLogs,
        List<Long> groundTruthIds) {

        long truePositive = relevantLogs.stream()
            .filter(log -> groundTruthIds.contains(log.getId()))
            .count();

        double precision = relevantLogs.isEmpty() ? 0 :
            (double) truePositive / relevantLogs.size() * 100;

        double recall = groundTruthIds.isEmpty() ? 0 :
            (double) truePositive / groundTruthIds.size() * 100;

        log.info("📊 RAG 평가 - Precision: {}%, Recall: {}% | 검색: {}개중 정답 {}개 | 정답: {}개중 {}개 검색됨",
            String.format("%.1f", precision),
            String.format("%.1f", recall),
            relevantLogs.size(), truePositive,
            groundTruthIds.size(), truePositive);
    }

    private String buildSearchQuery(PullRequest pr, String optimizedDiff) {
        StringBuilder query = new StringBuilder();
        query.append(pr.getTitle()).append(" ");

        if (pr.getDiffSummary() != null) {
            query.append(pr.getDiffSummary()).append(" ");
        }

        // diff에서 주석 라인만 추출
        String commentKeywords = Arrays.stream(optimizedDiff.split("\n"))
            .filter(line -> line.startsWith("+") && !line.startsWith("+++"))
            .map(line -> line.substring(1).trim())
            .filter(line -> line.startsWith("//") || line.startsWith("*"))
            .limit(10)
            .collect(Collectors.joining(" "));

        // 주석이 없으면 일반 코드 라인 fallback
        if (commentKeywords.isBlank()) {
            String codeKeywords = Arrays.stream(optimizedDiff.split("\n"))
                .filter(line -> line.startsWith("+") && !line.startsWith("+++"))
                .map(line -> line.substring(1).trim())
                .filter(line -> line.length() > 5)
                .filter(line -> !line.startsWith("import")
                    && !line.startsWith("@")
                    && !line.equals("{")
                    && !line.equals("}"))
                .limit(10)
                .collect(Collectors.joining(" "));
            query.append(codeKeywords);
        } else {
            query.append(commentKeywords);
        }

        return query.toString();
    }

}