package com.ssafy.gguljob.backend.domain.job.dto.response;

import java.util.List;

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
  private String matchStatus; // "최적합", "적합", "보통", "미흡", "부족"
  private Integer topPercentile; // 상위 N%
  private Double matchPercentage; // 내 실제 매칭 점수 (게이지 길이 결정)
  private Double cutoffTop;    // 상위 20% 커트라인 (최적합 기준)
  private Double cutoffHigh;   // 상위 40% 커트라인 (적합 기준)
  private Double cutoffMedium; // 상위 60% 커트라인 (보통 기준)
  private Double cutoffLow;    // 상위 80% 커트라인 (미흡 기준)
  private Double averageScore; // 해당 공고 가상 지원자 평균
  private String logoUrl; // 회사 로고 URL
  private List<String> techStacks; // 기술 스택 목록 (프론트 필터링용)
  private String jobCategory; // 직무 카테고리
}
