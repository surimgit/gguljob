package com.ssafy.gguljob.backend.domain.job.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendedJobDto {
  private Long jobId;
  private String companyName;
  private String title;
  private String region;
  private String experience;
  private String contractType;
  private String salary;
  private String matchStatus; // "적합", "보통", "부족"
  private Double matchPercentage; // 백분율 점수 (프로그레스바 용도)
  private Double cutoffHigh; // "적합" 기준 점수 (상위 30%)
  private Double cutoffMedium; // "보통" 기준 점수 (상위 60%)
  private Double averageScore; // 평균 기준 점수
}
