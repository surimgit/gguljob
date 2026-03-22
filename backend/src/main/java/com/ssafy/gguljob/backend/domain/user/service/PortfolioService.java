package com.ssafy.gguljob.backend.domain.user.service;

import com.ssafy.gguljob.backend.domain.ai.service.AiChatService;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import com.ssafy.gguljob.backend.domain.troubleshooting.repository.TroubleshootingRepository;
import com.ssafy.gguljob.backend.domain.user.dto.PortfolioRequest;
import com.ssafy.gguljob.backend.domain.user.dto.PortfolioResponse;
import com.ssafy.gguljob.backend.domain.user.entity.Portfolio;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.PortfolioRepository;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final TroubleshootingRepository troubleshootingRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final AiChatService aiChatService;

    @Value("${portfolio.local-path:./portfolios}")
    private String localBasePath;

    // 외부에서 파일 접근용 base URL (예: http://localhost:8080/portfolios)
    @Value("${portfolio.base-url:http://localhost:8080/portfolios}")
    private String baseUrl;

    private static final String SYSTEM_PROMPT = """
        <role>
        You are a senior technical writer creating developer portfolio documents in Korean.
        You specialize in transforming raw troubleshooting records into compelling,
        professional Markdown portfolios that showcase a developer's problem-solving ability.
        </role>

        <goal>
        Produce a single, complete Markdown portfolio document that:
        1. Opens with each project overview section
        2. Presents each troubleshooting record as a structured case study under its project
        3. Closes with a "기술 역량 요약" section synthesizing the developer's growth
        </goal>

        <output_format>
        - Language: Korean only
        - Format: Valid Markdown with headings (##, ###)
        - Do NOT wrap the entire output in a code fence
        - Each troubleshooting case must follow this structure:
          ### [순번]. [제목]
          **문제 상황**: ...
          **원인 분석**: ...
          **해결 방법**: ...
          **기술적 인사이트**: ...
        </output_format>

        <constraints>
        - If a field is missing or blank, skip that field entirely — do not guess or fabricate
        - Keep each case study concise: 150–300 words
        - The "기술 역량 요약" must reference specific technologies and patterns observed across all cases
        - If multiple projects exist, separate each with a ## project heading
        </constraints>

        <example_case>
        ### 1. Redis 캐시 키 충돌로 인한 데이터 오염 문제
        **문제 상황**: 서로 다른 유저의 응답이 혼재되어 반환되는 현상 발생.
        **원인 분석**: 캐시 키에 userId가 포함되지 않아 전역 키가 공유됨.
        **해결 방법**: 캐시 키를 `ai:ans:{userId}:{msgHash}` 형태로 네임스페이스 분리.
        **기술적 인사이트**: 멀티테넌트 환경에서 캐시 설계 시 항상 식별자를 키에 포함해야 함.
        </example_case>
        """;

    @Transactional(readOnly = true)
    public List<PortfolioResponse.Summary> getMyPortfolios(Long userId) {
        return portfolioRepository.findByUserIdOrderByUpdatedAtDesc(userId)
            .stream()
            .map(PortfolioResponse.Summary::from)
            .toList();
    }

    @Transactional
    public PortfolioResponse.GenerateResult generatePortfolio(
        long userId,
        PortfolioRequest.Generate request
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 제목
        long count = portfolioRepository.countByUser(user);
        String title = "포트폴리오(" + (count + 1) + ")";

        List<Troubleshooting> tsList =
            troubleshootingRepository.findAllByIdIn(request.tsIds());

        if (tsList.isEmpty()) {
            throw new IllegalArgumentException("유효한 트러블슈팅 데이터가 없습니다.");
        }

        boolean isOwnerValid = tsList.stream()
            .allMatch(ts -> ts.getUser().getId().equals(userId));
        if (!isOwnerValid) {
            throw new SecurityException("본인의 트러블슈팅만 포트폴리오로 생성할 수 있습니다.");
        }

        // 프로젝트별 그룹핑
        Map<Long, List<Troubleshooting>> groupedByProject = tsList.stream()
            .collect(Collectors.groupingBy(ts -> ts.getProject().getId()));

        String userPrompt = buildUserPrompt(title, groupedByProject);
        String markdownContent = aiChatService.callClaudeApiWithSystem(SYSTEM_PROMPT, userPrompt);

        // 로컬 파일 저장 (S3 대체 예정)
        String fileUrl = saveToLocal(userId, markdownContent);

        // Portfolio 저장
        Portfolio portfolio = Portfolio.builder()
            .user(user)
            .title(title)
            .s3Url(fileUrl)   // 현재 컬럼명은 s3_url이지만 로컬 URL 저장
            .isPublic(true)
            .build();

        Portfolio saved = portfolioRepository.save(portfolio);

        log.info("✅ 포트폴리오 생성 완료 - userId: {}, portfolioId: {}, title: {}, projectCount: {}, tsCount: {}",
            userId, saved.getId(), title, groupedByProject.size(), tsList.size());

        return new PortfolioResponse.GenerateResult(
            saved.getId(),
            saved.getS3Url(),
            saved.getTitle(),
            saved.getIsPublic()
        );
    }

    // ----------------------------------------------------------------
    // 로컬 파일 저장 (S3 변경 예정)
    // ----------------------------------------------------------------
    private String saveToLocal(long userId, String markdownContent) {
        try {
            Path dirPath = Paths.get(localBasePath, String.valueOf(userId));
            Files.createDirectories(dirPath);

            String fileName = System.currentTimeMillis() + ".md";
            Path filePath = dirPath.resolve(fileName);
            Files.writeString(filePath, markdownContent, StandardCharsets.UTF_8);

            log.info("📄 로컬 파일 저장 완료: {}", filePath);

            // 프론트에 반환할 URL
            return baseUrl + "/" + userId + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("포트폴리오 파일 저장 실패: " + e.getMessage());
        }
    }

    // ----------------------------------------------------------------
    // 유저 프롬프트 빌더 (프로젝트별 그룹핑)
    // ----------------------------------------------------------------
    private String buildUserPrompt(String portfolioTitle,
        Map<Long, List<Troubleshooting>> groupedByProject) {
        StringBuilder sb = new StringBuilder();

        sb.append("<context>\n");
        sb.append("이 포트폴리오는 여러 프로젝트에서 발생한 트러블슈팅 경험을 정리한 문서입니다. ");
        sb.append("채용 담당자와 기술 면접관이 개발자의 문제 해결 능력을 평가하는 데 사용됩니다.\n");
        sb.append("</context>\n\n");

        sb.append("<portfolio_title>").append(portfolioTitle).append("</portfolio_title>\n\n");

        sb.append("<projects>\n");
        for (List<Troubleshooting> tsList : groupedByProject.values()) {
            Project project = tsList.get(0).getProject();

            sb.append("<project>\n");
            appendIfPresent(sb, "프로젝트명", project.getTitle());
            appendIfPresent(sb, "팀명", project.getTeamName());
            appendIfPresent(sb, "도메인", project.getDomain() != null ? project.getDomain().name() : null);
            appendIfPresent(sb, "상태", project.getStatus() != null ? project.getStatus().name() : null);
            appendIfPresent(sb, "설명", project.getDescription());
            if (project.getReadme() != null && !project.getReadme().isBlank()) {
                String readme = project.getReadme().length() > 500
                    ? project.getReadme().substring(0, 500) + "..."
                    : project.getReadme();
                appendIfPresent(sb, "README 요약", readme);
            }

            sb.append("<troubleshooting_records>\n");
            for (int i = 0; i < tsList.size(); i++) {
                Troubleshooting ts = tsList.get(i);
                sb.append("<record index=\"").append(i + 1).append("\">\n");
                appendIfPresent(sb, "제목", ts.getTitle());
                appendIfPresent(sb, "역할", ts.getRole() != null ? ts.getRole().name() : null);
                appendIfPresent(sb, "언어", ts.getLanguage());
                appendIfPresent(sb, "프레임워크", ts.getFramework());
                appendIfPresent(sb, "상황", ts.getSituation());
                appendIfPresent(sb, "해결책", ts.getSolution());
                if (ts.getCodeSnippet() != null && !ts.getCodeSnippet().isBlank()) {
                    sb.append("코드 스니펫:\n```\n").append(ts.getCodeSnippet()).append("\n```\n");
                }
                appendIfPresent(sb, "자신감 지표", ts.getConfidence());
                sb.append("</record>\n");
            }
            sb.append("</troubleshooting_records>\n");
            sb.append("</project>\n\n");
        }
        sb.append("</projects>\n\n");

        sb.append("<task>\n");
        sb.append("위 프로젝트별 개요와 트러블슈팅 기록을 바탕으로, <output_format>에 정의된 구조에 따라 ");
        sb.append("완성된 포트폴리오 Markdown 문서를 작성하세요. ");
        sb.append("프로젝트가 여러 개인 경우 각 프로젝트를 별도 ## 섹션으로 구분하세요.\n");
        sb.append("</task>");

        return sb.toString();
    }

    private void appendIfPresent(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append("**").append(label).append("**: ").append(value).append("\n");
        }
    }
}