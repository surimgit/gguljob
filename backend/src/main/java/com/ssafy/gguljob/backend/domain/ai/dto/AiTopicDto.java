package com.ssafy.gguljob.backend.domain.ai.dto;

import java.util.List;
import lombok.Builder;

public class AiTopicDto {

    public record RecommendRequest(
        String keyword
    ) {}

    @Builder
    public record RecommendResponse(
        Long projectId,
        String domain,
        List<String> recommendedTopics
    ) {}

}
