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
  // 상대평가 커트라인 및 평균 점수 필드 추가
  private Double cutoffHigh;
  private Double cutoffMedium;
  private Double averageScore;
}
