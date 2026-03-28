package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.type.WorkExperienceYear;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserEmbeddingService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final RestTemplate restTemplate;
    private final Neo4jClient neo4jClient;

    @Value("${gms.api.key}")
    private String gmsApiKey;

    private static final String GMS_EMBEDDING_URL =
        "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings";
    private static final String EMBEDDING_MODEL = "text-embedding-3-small";


    @Transactional(readOnly = true)
    public void updateEmbedding(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("임베딩 업데이트 대상 유저를 찾을 수 없습니다: {}", userId);
            return;
        }

        String text = buildEmbeddingText(user);
        if (text == null || text.isBlank()) {
            log.info("임베딩 생성 가능한 텍스트 없음, 건너뜀: userId={}", userId);
            return;
        }

        List<Float> embedding = callGmsEmbeddingApi(text);
        if (embedding == null) {
            log.warn("임베딩 API 호출 실패: userId={}", userId);
            return;
        }

        saveEmbeddingToNeo4j(userId, embedding);
        log.info("유저 임베딩 업데이트 완료: userId={}", userId);
    }

    private String buildEmbeddingText(User user) {
        List<String> parts = new java.util.ArrayList<>();

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            String roles = user.getRoles().stream().map(Enum::name).collect(Collectors.joining(", "));
            parts.add("직무: " + roles);
        }
        if (user.getWorkExperience() != null && user.getWorkExperience() != WorkExperienceYear.NEWCOMER) {
            parts.add("실무 경험: " + user.getWorkExperience().getDescription());
        }
        if (user.getUserSkills() != null && !user.getUserSkills().isEmpty()) {
            String skills = user.getUserSkills().stream()
                .map(us -> us.getSkill().getName())
                .collect(Collectors.joining(", "));
            parts.add("보유 스킬: " + skills);
        }
        if (user.getDescription() != null && !user.getDescription().isBlank()) {
            parts.add("자기소개: " + user.getDescription().strip());
        }

        // README: 완료된 프로젝트 전체 (리더 + 팀원 참여 프로젝트, 최신순)
        List<String> readmes = new java.util.ArrayList<>();
        readmes.addAll(projectRepository.findReadmesByLeaderId(user.getId()));
        readmes.addAll(projectRepository.findReadmesByMemberId(user.getId()));
        String readmeText = readmes.isEmpty() ? null : String.join("\n\n---\n", readmes);

        String profileText = String.join("\n", parts);

        if (readmeText != null) {
            return profileText.isBlank() ? readmeText : readmeText + "\n\n---\n" + profileText;
        }
        return profileText.isBlank() ? null : profileText;
    }

    @SuppressWarnings("unchecked")
    private List<Float> callGmsEmbeddingApi(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(gmsApiKey);

            Map<String, String> body = Map.of(
                "model", EMBEDDING_MODEL,
                "input", text.length() > 8000 ? text.substring(0, 8000) : text
            );

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(GMS_EMBEDDING_URL, request, Map.class);

            if (response == null) return null;

            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            if (data == null || data.isEmpty()) return null;

            List<Number> rawEmbedding = (List<Number>) data.get(0).get("embedding");
            return rawEmbedding.stream().map(Number::floatValue).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("GMS 임베딩 API 호출 오류: {}", e.getMessage());
            return null;
        }
    }

    private void saveEmbeddingToNeo4j(Long userId, List<Float> embedding) {
        neo4jClient.query("""
                MATCH (u:User {id: $uid})
                SET u.embedding = $embedding
                """)
            .bind(userId).to("uid")
            .bind(embedding).to("embedding")
            .run();
    }
}
