package com.ssafy.gguljob.backend.domain.ai.service;

import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final RestTemplate restTemplate;

    @Value("${gms.api.key}")
    private String gmsApiKey;

    private static final String EMBEDDING_URL =
        "https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings";
    private static final String MODEL = "text-embedding-3-large";

    public float[] embed(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(gmsApiKey);

        Map<String, String> body = Map.of(
            "model", MODEL,
            "input", text
        );

        try {
            ResponseEntity<EmbeddingResponse> response = restTemplate.exchange(
                EMBEDDING_URL,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                EmbeddingResponse.class
            );

            return response.getBody().data().get(0).embedding();

        } catch (Exception e) {
            log.error("❌ 임베딩 생성 실패: {}", e.getMessage());
            throw new RuntimeException("임베딩 생성 중 오류가 발생했습니다.");
        }
    }

    // GMS 응답 파싱용 record
    private record EmbeddingResponse(List<EmbeddingData> data) {}
    private record EmbeddingData(float[] embedding) {}
}