package com.ssafy.gguljob.backend.domain.job.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JobRecommendationResponse {
  private Long jobId;
  private String title;
  private Double graphScore;
  private Double vectorScore;
  private Double finalScore;
}
