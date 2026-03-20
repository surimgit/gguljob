package com.ssafy.gguljob.backend.domain.ai.service;

import com.ssafy.gguljob.backend.domain.ai.entity.ChatLog;
import com.ssafy.gguljob.backend.domain.ai.event.ChatLogSavedEvent;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.args.SortingOrder;
import redis.clients.jedis.exceptions.JedisDataException;
import redis.clients.jedis.search.FTCreateParams;
import redis.clients.jedis.search.FTSearchParams;
import redis.clients.jedis.search.Document;
import redis.clients.jedis.search.IndexDataType;
import redis.clients.jedis.search.schemafields.NumericField;
import redis.clients.jedis.search.schemafields.VectorField;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatLogVectorService {

    private final JedisPooled jedis;
    private final EmbeddingService embeddingService;

    private static final String INDEX_NAME = "chatlog-idx";
    private static final String KEY_PREFIX = "chatlog:";
    private static final int DIMENSION = 3072;

    // 앱 시작 시 인덱스 생성
    @jakarta.annotation.PostConstruct
    public void createIndex() {
        try {
            jedis.ftCreate(INDEX_NAME,
                FTCreateParams.createParams()
                    .on(IndexDataType.HASH)
                    .prefix(KEY_PREFIX),
                NumericField.of("projectId"),
                NumericField.of("chatLogId").noIndex(),
                VectorField.builder()
                    .fieldName("embedding")
                    .algorithm(VectorAlgorithm.HNSW)
                    .addAttribute("TYPE", "FLOAT32")
                    .addAttribute("DIM", String.valueOf(DIMENSION))
                    .addAttribute("DISTANCE_METRIC", "COSINE")
                    .build()
            );
            log.info("✅ chatlog 벡터 인덱스 생성 완료");
        } catch (JedisDataException e) {
            // 이미 인덱스 존재하면 무시
            log.info("chatlog 벡터 인덱스 이미 존재함");
        }
    }

    @Async
    @EventListener
    public void handleChatLogSaved(ChatLogSavedEvent event) {
        try {
            float[] embedding = embeddingService.embed(event.content());
            byte[] embeddingBytes = floatArrayToBytes(embedding);

            String key = KEY_PREFIX + event.chatLogId();

            // String 필드 저장
            jedis.hset(key, "chatLogId", event.chatLogId().toString());
            jedis.hset(key, "projectId", event.projectId().toString());
            if (event.prId() != null) {
                jedis.hset(key, "prId", event.prId().toString());
            }

            // embedding byte[] 별도 저장 (binary)
            jedis.hset(
                key.getBytes(),
                "embedding".getBytes(),
                embeddingBytes
            );

            log.info("✅ ChatLog 임베딩 저장 완료: {}", event.chatLogId());

        } catch (Exception e) {
            log.error("❌ ChatLog 임베딩 저장 실패 - chatLogId: {}",
                event.chatLogId(), e);
        }
    }

    public List<Long> findSimilarChatLogIds(String query, Long projectId, int topK) {
        try {
            float[] queryEmbedding = embeddingService.embed(query);
            byte[] queryBytes = floatArrayToBytes(queryEmbedding);

            // 필터 없이 먼저 전체 검색으로 테스트
            var result = jedis.ftSearch(INDEX_NAME,
                "*=>[KNN " + topK + " @embedding $vec AS score]",
                FTSearchParams.searchParams()
                    .addParam("vec", queryBytes)
                    .sortBy("score", SortingOrder.ASC)
                    .dialect(2)
            );

            List<Long> ids = new ArrayList<>();
            for (Document doc : result.getDocuments()) {
                String key = doc.getId();
                Long chatLogId = Long.parseLong(key.replace(KEY_PREFIX, ""));

                // projectId 후처리 필터링 (기존 방식으로 롤백)
                String storedProjectId = (String) doc.get("projectId");
                log.info("🔍 검색된 doc - key: {}, projectId: {}, score: {}",
                    key, storedProjectId, doc.get("score"));

                if (projectId.toString().equals(storedProjectId)) {
                    ids.add(chatLogId);
                }
            }

            log.info("🔍 유사도 검색 결과: {}개", ids.size());
            return ids;

        } catch (Exception e) {
            log.error("❌ 유사도 검색 실패", e);
            return List.of();
        }
    }

    // float[] → byte[] 변환 (Redis 벡터 저장 형식)
    private byte[] floatArrayToBytes(float[] floats) {
        ByteBuffer buffer = ByteBuffer.allocate(floats.length * 4)
            .order(ByteOrder.LITTLE_ENDIAN);
        for (float f : floats) {
            buffer.putFloat(f);
        }
        return buffer.array();
    }

    private Map<String, String> toStringMap(Map<String, Object> fields) {
        Map<String, String> result = new HashMap<>();
        fields.forEach((k, v) -> {
            if (v instanceof byte[]) {
                // embedding은 별도 처리
            } else {
                result.put(k, v.toString());
            }
        });
        return result;
    }

    public void embedIfAbsent(List<ChatLog> chatLogs) {
        for (ChatLog chatLog : chatLogs) {
            String key = KEY_PREFIX + chatLog.getId();
            try {
                if (jedis.exists(key)) {
                    log.info("⏭ 이미 임베딩 존재, 스킵: {}", chatLog.getId()); // log = Logger
                    continue;
                }
                float[] embedding = embeddingService.embed(chatLog.getContent());
                byte[] embeddingBytes = floatArrayToBytes(embedding);

                jedis.hset(key, "chatLogId", chatLog.getId().toString());
                jedis.hset(key, "projectId", chatLog.getProject().getId().toString());
                if (chatLog.getPullRequest() != null) {
                    jedis.hset(key, "prId", chatLog.getPullRequest().getId().toString());
                }
                jedis.hset(key.getBytes(), "embedding".getBytes(), embeddingBytes);

                log.info("✅ 배치 임베딩 저장: {}", chatLog.getId());
            } catch (Exception e) {
                log.error("❌ 배치 임베딩 실패 - chatLogId: {}", chatLog.getId(), e);
            }
        }
    }
}