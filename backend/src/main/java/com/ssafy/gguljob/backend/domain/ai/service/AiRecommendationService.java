package com.ssafy.gguljob.backend.domain.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.gguljob.backend.domain.ai.dto.AiTopicDto;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private final RestTemplate restTemplate;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @Value("${gms.api.key}")
    private String gmsKey;
    private final String GMS_GEMINI_URL = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

    @Transactional(readOnly = true)
    public AiTopicDto.RecommendResponse recommendTopics(Long projectId, AiTopicDto.RecommendRequest request) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));
        String domain = project.getDomain();
        String keyword = request.keyword();
        boolean isRefresh = request.isRefresh();

        String keywordSuffix = (keyword != null && !keyword.isBlank()) ? keyword.trim() : "default";

        String currentDisplayCacheKey = "ai:topics:current:" + projectId + ":" + keywordSuffix;
        String historyCacheKey = "ai:topics:history:" + projectId + ":" + keywordSuffix;

        // [비용 방어] 단순 접속인데, 기존 캐시가 있다면? -> API 호출 X
        if (!isRefresh) {
            String cachedTopicsJson = redisTemplate.opsForValue().get(currentDisplayCacheKey);
            if (cachedTopicsJson != null) {
                log.info("🚀 캐시 히트! Gemini API 호출 없이 기존 캐시 데이터를 반환합니다. (비용 0원)");
                List<String> cachedTopics = parseAiResponse(cachedTopicsJson);
                return new AiTopicDto.RecommendResponse(projectId, domain, cachedTopics);
            }
        }

        // 캐시가 없거나(최초 접속), 새로 추천(isRefresh=true)을 누른 경우 -> API 호출 O
        Set<String> previousTopics = redisTemplate.opsForSet().members(historyCacheKey);

        String systemPrompt = """
            당신은 10년 차 수석 IT 사이드 프로젝트 기획자입니다.
            사용자가 제공하는 '도메인'과 '키워드'를 분석하여 실용적이고 트렌디한 웹/앱 프로젝트 주제를 정확히 4개 추천하세요.
            
            [제약 조건]
            - 각 주제는 20자 내외의 명확한 명사형 문장으로 작성하세요.
            - 어떠한 부가 설명이나 인사말도 포함하지 마세요.
            - 반드시 4개의 문자열로 이루어진 JSON Array 형태로만 응답하세요.
            """;

        String userPrompt = "도메인: " + domain;
        if (keyword != null && !keyword.isBlank()) {
            userPrompt += "\n키워드: " + keyword + "\n요청: 위 도메인 환경에서 주어진 키워드를 핵심 기능으로 활용한 참신한 주제 4가지를 추천해줘.";
        } else {
            userPrompt += "\n요청: 해당 도메인 내에서 매번 새롭고 다양한 관점의 기발한 주제 4가지를 랜덤으로 생성해줘.";
        }

        if (previousTopics != null && !previousTopics.isEmpty()) {
            userPrompt += "\n\n[매우 중요] 이전에 추천했던 다음 주제들은 절대 중복해서 다시 추천하지 마세요:\n"
                + String.join(", ", previousTopics);
        }

        // Gemini API 호출
        String aiResponseText = callGeminiApi(systemPrompt, userPrompt);
        List<String> topics = parseAiResponse(aiResponseText);

        if (topics != null && !topics.isEmpty()) {
            try {
                String topicsJson = objectMapper.writeValueAsString(topics);
                redisTemplate.opsForValue().set(currentDisplayCacheKey, topicsJson, 24, TimeUnit.HOURS);

                redisTemplate.opsForSet().add(historyCacheKey, topics.toArray(new String[0]));
                redisTemplate.expire(historyCacheKey, 24, TimeUnit.HOURS);
            } catch (JsonProcessingException e) {
                log.error("캐시 저장 중 직렬화 실패", e);
            }
        }

        return AiTopicDto.RecommendResponse.builder()
            .projectId(projectId)
            .domain(domain)
            .recommendedTopics(topics)
            .build();
    }

    private String callGeminiApi(String systemPrompt, String userMessage) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", gmsKey);

        Map<String, Object> body = new HashMap<>();

        body.put("systemInstruction", Map.of(
            "parts", List.of(Map.of("text", systemPrompt))
        ));

        body.put("contents", List.of(Map.of(
            "parts", List.of(Map.of("text", userMessage))
        )));

        body.put("generationConfig", Map.of(
            "temperature", 0.8,
            "responseMimeType", "application/json"
        ));

        ResponseEntity<Map> response = restTemplate.exchange(
            GMS_GEMINI_URL, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class
        );

        // 응답 텍스트 추출
        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

        return (String) parts.get(0).get("text");
    }

    private List<String> parseAiResponse(String responseText) {
        try {
            return objectMapper.readValue(responseText.trim(), new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.error("AI 응답 JSON 파싱 실패. 응답 텍스트: {}", responseText, e);
            throw new RuntimeException("AI 응답을 처리하는 중 오류가 발생했습니다.");
        }
    }
}