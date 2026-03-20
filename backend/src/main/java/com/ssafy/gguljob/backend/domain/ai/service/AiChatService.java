package com.ssafy.gguljob.backend.domain.ai.service;

import com.ssafy.gguljob.backend.domain.ai.dto.ChatResponse;
import com.ssafy.gguljob.backend.domain.ai.dto.ChatRequest;
import com.ssafy.gguljob.backend.domain.ai.entity.ChatLog;
import com.ssafy.gguljob.backend.domain.ai.event.ChatLogSavedEvent;
import com.ssafy.gguljob.backend.domain.ai.repository.ChatLogRepository;
import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
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
public class AiChatService {

    private final RestTemplate restTemplate;
    private final ChatLogRepository chatLogRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final StringRedisTemplate redisTemplate;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Value("${gms.api.key}")
    private String gmsKey;

    private final String GMS_CLAUDE_URL = "https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages";

    // 1분 최대 5회, 동일 메세지 연타 방지 (5초), 답변 캐시 (24시간)
    private final int RATE_LIMIT = 5;
    private final int LOCK_TTL = 5;
    private final int ANSWER_CACHE_TTL = 24;

    public ChatResponse.ChatMessageResponse processAndSaveChat(long userId, ChatRequest.ChatMessageRequest request) {
        String userMsg = request.userMessage().trim();
        String msgHash = String.valueOf(userMsg.hashCode());

        // 가상 스레드 확인
        log.info("🚀 현재 일하고 있는 스레드: {}", Thread.currentThread());

        // Rate Limiting (유저당 1분당 횟수 제한)
        String rlKey = "ai:rl:" + userId;
        long currentCount = redisTemplate.opsForValue().increment(rlKey);

        if (currentCount == 1) {
            redisTemplate.expire(rlKey, 1, TimeUnit.MINUTES);
        }

        if (currentCount > RATE_LIMIT) {
            log.warn("🚨 Rate Limit 초과: User {}", userId);
            return new ChatResponse.ChatMessageResponse("과도한 요청입니다. 1분 뒤에 다시 시도해주세요.");
        }

        // Short-lived Cache (중복 요청/연타 방지용 락)
        String lockKey = "ai:lock:" + userId + ":" + msgHash;
        Boolean isFirstRequest = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "processing", LOCK_TTL, TimeUnit.SECONDS);

        if (Boolean.FALSE.equals(isFirstRequest)) {
            return new ChatResponse.ChatMessageResponse("이미 처리 중인 질문이거나 요청이 너무 빠릅니다.");
        }

        // Answer Cache 확인
        String ansKey = "ai:ans:" + msgHash;
        String cachedAns = redisTemplate.opsForValue().get(ansKey);
        if (cachedAns != null) {
            log.info("🚀 캐시 히트! AI 서버 호출 없이 응답합니다.");
            return new ChatResponse.ChatMessageResponse(cachedAns);
        }

        try {

            String aiResponseText = callClaudeApi(userMsg);

            redisTemplate.opsForValue().set(ansKey, aiResponseText, ANSWER_CACHE_TTL, TimeUnit.HOURS);

            // DB 저장
            saveChatLog(
                userRepository.getReferenceById(userId),
                projectRepository.getReferenceById(request.projectId()),
                null,
                "Q: " + userMsg + "\n\nA: " + aiResponseText
            );

            return new ChatResponse.ChatMessageResponse(aiResponseText);

        } catch (Exception e) {
            log.error("AI 호출 중 예외 발생: ", e);
            redisTemplate.delete(lockKey);
            return new ChatResponse.ChatMessageResponse("AI 응답을 가져오는 중 오류가 발생했습니다.");
        }
    }

    public String callClaudeApi(String message) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", gmsKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> body = Map.of(
            "model", "claude-opus-4-1-20250805",
            "max_tokens", 1024,
            "messages", List.of(Map.of("role", "user", "content", message))
        );

        ResponseEntity<Map> response = restTemplate.exchange(
            GMS_CLAUDE_URL, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class
        );

        Map responseBody = response.getBody();
        List<Map<String, Object>> contentList = (List<Map<String, Object>>) responseBody.get("content");
        return (String) contentList.get(0).get("text");
    }

    @Transactional
    public ChatLog saveChatLog(User user, Project project,
        PullRequest pr, String content) {

        ChatLog saved = chatLogRepository.save(
            ChatLog.builder()
                .user(user)
                .project(project)
                .pullRequest(pr)
                .content(content)
                .build()
        );

        // 임베딩 비동기 저장
        applicationEventPublisher.publishEvent(new ChatLogSavedEvent(
            saved.getId(),
            project.getId(),
            pr != null ? pr.getId() : null,
            content
        ));

        return saved;
    }

    public String callClaudeApiWithSystem(String systemPrompt, String userPrompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", gmsKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> body = Map.of(
            "model", "claude-opus-4-1-20250805",
            "max_tokens", 1024,
            "system", systemPrompt,
            "messages", List.of(
                Map.of("role", "user", "content", userPrompt)
            )
        );

        ResponseEntity<Map> response = restTemplate.exchange(
            GMS_CLAUDE_URL, HttpMethod.POST,
            new HttpEntity<>(body, headers), Map.class
        );

        Map responseBody = response.getBody();

        // 토큰 사용량 로깅
        Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
        if (usage != null) {
            log.info("📊 토큰 사용량 - input: {}, output: {}, total: {}",
                usage.get("input_tokens"),
                usage.get("output_tokens"),
                (int) usage.get("input_tokens") + (int) usage.get("output_tokens")
            );
        }

        List<Map<String, Object>> contentList =
            (List<Map<String, Object>>) responseBody.get("content");
        return (String) contentList.get(0).get("text");
    }

}