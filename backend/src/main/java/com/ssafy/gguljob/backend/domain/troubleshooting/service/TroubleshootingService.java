package com.ssafy.gguljob.backend.domain.troubleshooting.service;

import com.ssafy.gguljob.backend.domain.ai.service.AiChatService;
import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.service.GithubSyncService;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingRequest;
import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingResponse;
import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import com.ssafy.gguljob.backend.domain.troubleshooting.repository.TroubleshootingRepository;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
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
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PullRequestRepository pullRequestRepository;
    private final GithubSyncService githubSyncService;

    private static final int MAX_DIFF_LENGTH = 3000;

    public List<TroubleshootingResponse.Widget> getMyWidgetList(Long userId) {
        return troubleshootingRepository.findTop2ByProject_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(TroubleshootingResponse.Widget::from)
            .collect(Collectors.toList());
    }

    public TroubleshootingResponse.GenerateResult generateAndSaveTroubleshooting(Long userId,
        TroubleshootingRequest.GenerateFromCommit request) {

        // 이미 분석된 데이터 확인
        Optional<Troubleshooting> existingData = troubleshootingRepository.findByPullRequest_Id(request.prId());
        if (existingData.isPresent()) {
            Troubleshooting data = existingData.get();
            return new TroubleshootingResponse.GenerateResult(
                data.getTitle(),
                data.getSituation(),
                data.getSolution(),
                data.getPullRequest().getTitle(),
                data.getPullRequest().getPrNumber()
            );
        }

        PullRequest pr = pullRequestRepository.findById(request.prId())
            .orElseThrow(() -> new IllegalArgumentException("해당 PR을 찾을 수 없습니다."));

        // Diff 데이터 가져오기
        String diffContent = pr.getDiffContent();
        if (diffContent == null || diffContent.trim().isEmpty()) {
            // 깃허브 API 주소로 보정
            String apiUrl = pr.getDiffUrl();
            if (apiUrl.contains("github.com") && !apiUrl.contains("api.github.com")) {
                apiUrl = apiUrl.replace("github.com", "[api.github.com/repos](https://api.github.com/repos)")
                    .replace("/pull/", "/pulls/");
            }

            log.info("🚀 Github에서 Diff 데이터를 가져오는 중: {}", apiUrl);
            diffContent = githubSyncService.fetchDiffFromGithub(apiUrl);

            if (diffContent == null || diffContent.isBlank()) {
                throw new RuntimeException("Github에서 Diff 데이터를 가져오는 데 실패했습니다.");
            }

            pr.updateDiffContent(diffContent);
            pullRequestRepository.save(pr);
        }

        // Diff 최적화 (수정 필요)
        String optimizedDiff = diffContent;
        if (optimizedDiff.length() > MAX_DIFF_LENGTH) {
            optimizedDiff = optimizedDiff.substring(0, MAX_DIFF_LENGTH) + "\n... (Diff truncated)";
        }

        // AI 호출 및 결과 정제
        String prompt = buildPrompt(pr.getTitle(), pr.getDiffSummary(), optimizedDiff);
        String llmResponseRaw = aiChatService.callClaudeApi(prompt);

        try {
            // AI 응답에서 마크다운 백틱(```json) 제거
            String cleanJson = llmResponseRaw;
            if (cleanJson.contains("```")) {
                cleanJson = cleanJson.replaceAll("(?s)^```(?:json)?\\s*(.*?)\\s*```$", "$1").trim();
            }

            log.info("정제된 JSON: {}", cleanJson);

            TroubleshootingResponse.GenerateResult resultDto =
                objectMapper.readValue(cleanJson, TroubleshootingResponse.GenerateResult.class);

            saveTroubleshootingData(userId, request, resultDto);

            return resultDto;

        } catch (Exception e) {
            log.error("❌ 트러블슈팅 JSON 파싱 또는 저장 실패. 원본 응답: {}", llmResponseRaw, e);
            throw new RuntimeException("AI 응답 파싱 중 오류가 발생했습니다.");
        }
    }

    @Transactional
    protected void saveTroubleshootingData(Long userId, TroubleshootingRequest.GenerateFromCommit request, TroubleshootingResponse.GenerateResult resultDto) {

        Troubleshooting entity = Troubleshooting.builder()
            .user(userRepository.getReferenceById(userId))
            .project(projectRepository.getReferenceById(request.projectId()))
            .pullRequest(pullRequestRepository.getReferenceById(request.prId()))
            .title(resultDto.title())
            .situation(resultDto.trouble())
            .solution(resultDto.shooting())
            .build();

        troubleshootingRepository.save(entity);
    }

    private String buildPrompt(String title, String content, String codeDiff) {
        return "너는 10년 차 시니어 소프트웨어 엔지니어이자 코드 프로파일러야. " +
            "아래 [PR 제목], [PR 본문], [Code Diff]를 종합적으로 분석하여 JSON 포맷으로 트러블슈팅을 작성해 줘.\n\n" +
            "특히 [PR 본문]에 개발자가 직접 작성한 문제 원인이나 해결 로직이 있다면 이를 적극 반영할 것.\n\n" +
            "[PR 제목]\n" + title + "\n\n" +
            "[PR 본문 (개발자 코멘트)]\n" + content + "\n\n" +
            "[Code Diff]\n" + codeDiff + "\n\n" +
            "[출력 형식 (반드시 JSON 포맷으로만 응답할 것)]\n" +
            "{\"title\": \"...\", \"trouble\": \"...\", \"shooting\": \"...\", \"result\": \"...\"}";
    }

    @Transactional
    public void updateTroubleshooting(Long userId, Long troubleshootingId, TroubleshootingRequest.Update request) {

        Troubleshooting troubleshooting = troubleshootingRepository.findById(troubleshootingId)
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
            request.solution()
        );
    }

}
