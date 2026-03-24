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
import com.ssafy.gguljob.backend.global.exception.ForbiddenException;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import com.ssafy.gguljob.backend.global.infra.s3.S3ImageService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final S3ImageService s3ImageService;

    private static final String SYSTEM_PROMPT = """
        <role>
        You are a senior technical writer creating developer portfolio documents in Korean.
        You specialize in transforming raw troubleshooting records into compelling,
        professional Markdown portfolios that showcase a developer's problem-solving ability.
        </role>

        <goal>
        Produce a single, complete Markdown portfolio document that:
        1. Follows the standard portfolio structure defined in <output_format>
        2. Presents each troubleshooting record as a structured case study under its project
        3. Includes at least one Mermaid.js diagram to visualize architecture or problem flow
        4. Closes with a "기술 역량 요약" section synthesizing the developer's growth
        </goal>

        <output_format>
        - Language: Korean only
        - Format: Valid Markdown — do NOT wrap the entire output in a code fence
        - Strictly follow this 5-section structure per project:

          ## 1. 프로젝트 개요
          | 항목 | 내용 |
          |------|------|
          | 프로젝트명 | ... |
          | 팀명 | ... |
          | 도메인 | ... |
          | 기술 스택 | ... |

          ## 2. 시스템 아키텍처
          > 반드시 아래와 같이 Mermaid 다이어그램을 1개 이상 포함하세요.
```mermaid
          graph TD
            A[클라이언트] --> B[API 서버]
            B --> C[데이터베이스]
```

          ## 3. 핵심 트러블슈팅
          각 케이스는 아래 구조를 따릅니다:
          ### [순번]. [제목]
          **문제 상황**: ...
          **원인 분석**: ...
          **해결 방법**: ...
          **기술적 인사이트**: ...

          ## 4. 성과 및 배운 점
          - 수치화 가능한 성과 (예: 응답속도 30% 개선)
          - 트러블슈팅을 통해 얻은 기술적 교훈

          ## 5. 기술 역량 요약
          - 전체 케이스를 관통하는 기술 패턴과 성장 서사
        </output_format>

        <diagram_rules>
        - Mermaid 코드 블록은 반드시 ```mermaid 로 열고 ``` 로 닫으세요.
        - 다이어그램 유형: graph TD(아키텍처), sequenceDiagram(요청 흐름), flowchart LR(문제 해결 흐름) 중 데이터에 가장 적합한 것을 선택하세요.
        - 다이어그램은 "시스템 아키텍처" 섹션에 반드시 포함되며, 트러블슈팅 케이스에도 흐름이 복잡하면 추가할 수 있습니다.
        - 노드 레이블에 특수문자([](){})가 포함될 경우 따옴표로 감싸세요: A["레이블"]
        </diagram_rules>

        <constraints>
        - 누락된 필드는 건너뛰고 절대 추측하거나 조작하지 마세요.
        - 각 트러블슈팅 케이스는 150~300 단어를 유지하세요.
        - 프로젝트가 여러 개인 경우 각 프로젝트를 별도 ## 프로젝트: [프로젝트명] 섹션으로 구분하세요.
        - 코드 블록(```language ... ```) 형식을 반드시 지키세요.
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
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 유저입니다."));

        List<Troubleshooting> tsList =
            troubleshootingRepository.findAllByIdIn(request.tsIds());

        if (tsList.isEmpty()) {
            throw new ResourceNotFoundException("유효한 트러블슈팅 데이터가 없습니다.");
        }

        boolean isOwnerValid = tsList.stream()
            .allMatch(ts -> ts.getUser().getId().equals(userId));
        if (!isOwnerValid) {
            throw new ForbiddenException("본인의 트러블슈팅만 포트폴리오로 생성할 수 있습니다.");
        }

        // 프로젝트별 그룹핑
        Map<Long, List<Troubleshooting>> groupedByProject = tsList.stream()
            .collect(Collectors.groupingBy(ts -> ts.getProject().getId()));

        // 제목: 프로젝트명 기반 (예: "프로젝트A · 프로젝트B 포트폴리오")
        String title = buildTitle(groupedByProject);

        String userPrompt = buildUserPrompt(title, groupedByProject);
        String markdownContent = aiChatService.callClaudeApiWithSystem(SYSTEM_PROMPT, userPrompt);

        // 파일 저장 (S3)
        String fileUrl = uploadToS3(userId, markdownContent);

        // Portfolio 저장
        Portfolio portfolio = Portfolio.builder()
            .user(user)
            .title(title)
            .s3Url(fileUrl)
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

    @Transactional
    public void deletePortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 포트폴리오입니다."));

        if (!portfolio.getUser().getId().equals(userId)) {
            throw new ForbiddenException("본인의 포트폴리오만 삭제할 수 있습니다.");
        }

        // S3 파일 삭제
        String s3Key = s3ImageService.extractS3Key(portfolio.getS3Url());
        s3ImageService.deleteObject(s3Key);

        portfolioRepository.delete(portfolio);

        log.info("🗑️ 포트폴리오 삭제 완료 - userId: {}, portfolioId: {}", userId, portfolioId);
    }

    @Transactional
    public void updateTitle(Long userId, Long portfolioId, String newTitle) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 포트폴리오입니다."));

        if (!portfolio.getUser().getId().equals(userId)) {
            throw new ForbiddenException("본인의 포트폴리오만 수정할 수 있습니다.");
        }

        portfolio.updateTitle(newTitle);
    }

    // ----------------------------------------------------------------
    // 제목 빌드 (프로젝트명 기반)
    // ----------------------------------------------------------------
    private String buildTitle(Map<Long, List<Troubleshooting>> groupedByProject) {
        List<String> projectNames = groupedByProject.values().stream()
            .map(tsList -> tsList.get(0).getProject().getTitle())
            .distinct()
            .toList();

        if (projectNames.size() <= 2) {
            return String.join(" · ", projectNames) + " 포트폴리오";
        }
        return projectNames.get(0) + " 외 " + (projectNames.size() - 1) + "개 포트폴리오";
    }

    // ----------------------------------------------------------------
    // S3 파일 저장
    // ----------------------------------------------------------------
    private String uploadToS3(long userId, String markdownContent) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        // 같은 날짜 중복 방지: 포트폴리오_2025-06-10_1718000000000.md
        String fileName = "포트폴리오_" + date + "_" + System.currentTimeMillis() + ".md";
        String s3Key = "portfolios/" + userId + "/" + fileName;

        s3ImageService.uploadMarkdown(markdownContent, s3Key);

        log.info("☁️ S3 업로드 완료: {}", s3Key);

        // CDN URL 반환 (s3ImageService.getImageUrl = cdnUrl + "/" + s3Key)
        return s3ImageService.getImageUrl(s3Key);
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