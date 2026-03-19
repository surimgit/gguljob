package com.ssafy.gguljob.backend.domain.ai.dto;

import com.ssafy.gguljob.backend.domain.project.type.Domain;
import java.util.List;
import lombok.Builder;

public class AiTopicDto {

    public record RecommendRequest(
        String keyword,
        boolean isRefresh
    ) {}

    @Builder
    public record RecommendResponse(
        Long projectId,
        Domain domain,
        List<String> recommendedTopics
    ) {}

}
