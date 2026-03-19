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
  private String url;
  private String deadline;
  private String matchStatus; // "적합", "보통", "부족" (글로벌 절대 기준)
  private Integer topPercentile; // 상위 N% (추정치)
  private Double matchPercentage; // 백분율 점수
  private Double cutoffHigh; // "적합" 기준 점수 (글로벌 상위 30% - 게이지바 구분용)
  private Double cutoffMedium; // "보통" 기준 점수 (글로벌 상위 60% - 게이지바 구분용)
  private Double averageScore; // 해당 공고 지원자(가상) 평균 (맞춤 비교용)
  private String logoUrl; // 회사 로고 URL (추가)
}
