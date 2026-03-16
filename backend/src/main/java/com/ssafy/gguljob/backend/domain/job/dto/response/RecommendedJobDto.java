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
}