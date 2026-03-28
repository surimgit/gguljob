package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectEmbeddingService {

    private final ProjectRepository projectRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final RestTemplate restTemplate;
    private final Neo4jClient neo4jClient;

    @Value("${gms.api.key}")
    private String gmsApiKey;

    private static final String GMS_EMBEDDING_URL =
        "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings";
    private static final String EMBEDDING_MODEL = "text-embedding-3-small";

    public void updateEmbedding(Long projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            log.warn("임베딩 업데이트 대상 프로젝트를 찾을 수 없습니다: projectId={}", projectId);
            return;
        }

        String text = buildEmbeddingText(project);
        if (text == null || text.isBlank()) {
            log.info("임베딩 생성 가능한 텍스트 없음, 건너뜀: projectId={}", projectId);
            return;
        }

        List<Float> embedding = callGmsEmbeddingApi(text);
        if (embedding == null) {
            log.warn("임베딩 API 호출 실패: projectId={}", projectId);
            return;
        }

        saveEmbeddingToNeo4j(projectId, embedding);
        log.info("프로젝트 임베딩 업데이트 완료: projectId={}", projectId);
    }

    private String buildEmbeddingText(Project project) {
        List<String> parts = new java.util.ArrayList<>();

        if (project.getDomain() != null) {
            parts.add("도메인: " + project.getDomain().name());
        }
        if (project.getDescription() != null && !project.getDescription().isBlank()) {
            parts.add("설명: " + project.getDescription().strip());
        }

        List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());
        if (!skills.isEmpty()) {
            parts.add("기술 스택: " + String.join(", ", skills));
        }

        return parts.isEmpty() ? null : String.join("\n", parts);
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

    private void saveEmbeddingToNeo4j(Long projectId, List<Float> embedding) {
        neo4jClient.query("""
                MATCH (p:Project {id: $pid})
                SET p.embedding = $embedding
                """)
            .bind(String.valueOf(projectId)).to("pid")
            .bind(embedding).to("embedding")
            .run();
    }
}
