package com.ssafy.gguljob.backend.domain.job.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ssafy.gguljob.backend.domain.job.dto.response.JobRecommendationResponse;
import com.ssafy.gguljob.backend.domain.job.dto.response.RecommendedJobDto;
import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import com.ssafy.gguljob.backend.domain.job.repository.JobPostingRepository;
import com.ssafy.gguljob.backend.domain.job.repository.JobRecommendationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobRecommendationService {

  private final JobRecommendationRepository jobRecommendationRepository;
  private final JobPostingRepository jobPostingRepository;

  public List<RecommendedJobDto> getTop3Recommendations(Long userId) {
    return getRecommendations(userId, 3, 0);
  }

  public List<RecommendedJobDto> getRegularRecommendations(Long userId, int skip) {
    return getRecommendations(userId, 10, skip);
  }

  private List<RecommendedJobDto> getRecommendations(Long userId, int limit, int skip) {
    Collection<JobRecommendationResponse> neo4jResults =
        jobRecommendationRepository.recommendJobsForUser(userId, limit, skip);

    List<Long> jobIds =
        neo4jResults.stream().map(JobRecommendationResponse::getJobId).collect(Collectors.toList());

    if (jobIds.isEmpty()) {
      return List.of();
    }

    List<JobPosting> jobPostings = jobPostingRepository.findByIdIn(jobIds);

    Map<Long, JobPosting> jobMap =
        jobPostings.stream().collect(Collectors.toMap(JobPosting::getId, Function.identity()));

    return neo4jResults.stream().filter(neo -> jobMap.containsKey(neo.getJobId())).map(neo -> {
      JobPosting dbJob = jobMap.get(neo.getJobId());

      // Cypher 쿼리에서 이미 100점 만점으로 계산된 값이 넘어옵니다.
      // 소수점 첫째 자리까지만 표시되도록 반올림
      double matchPercentage = Math.round(neo.getFinalScore() * 10.0) / 10.0;
      double jobAverageScore = Math.round(neo.getAverageScore() * 10.0) / 10.0;

      // 게이지바 비교 기준을 공고별 전용 커트라인으로 롤백 (사용자 체감 구체화)
      double jobCutoffHigh =
          Math.round((neo.getCutoffHigh() != null ? neo.getCutoffHigh() : 70.0) * 10.0) / 10.0;
      double jobCutoffMedium =
          Math.round((neo.getCutoffMedium() != null ? neo.getCutoffMedium() : 40.0) * 10.0) / 10.0;

      // 상위 N% 여부를 matchStatus로 세분화하여 표현
      String matchStatus;
      int topPercentile;

      if (matchPercentage >= jobCutoffHigh) {
        matchStatus = "적합"; // 큰 카테고리로 변경 (종전 '완전 적합'에서 롤백)
        double ratio =
            jobCutoffHigh >= 100.0 ? 0 : (100.0 - matchPercentage) / (100.0 - jobCutoffHigh);
        topPercentile = (int) Math.max(1, Math.round(30.0 * ratio));
      } else if (matchPercentage >= jobCutoffMedium) {
        matchStatus = "보통"; // 큰 카테고리로 변경
        double diff = jobCutoffHigh - jobCutoffMedium;
        double ratio = diff <= 0 ? 0 : (jobCutoffHigh - matchPercentage) / diff;
        topPercentile = (int) Math.max(31, Math.round(30.0 + 30.0 * ratio));
      } else {
        matchStatus = "부족"; // 큰 카테고리로 변경
        double ratio =
            jobCutoffMedium <= 0 ? 0 : (jobCutoffMedium - matchPercentage) / jobCutoffMedium;
        topPercentile = (int) Math.min(99, Math.round(60.0 + 40.0 * ratio));
      }

      // 보정 (안전장치)
      if (topPercentile < 1)
        topPercentile = 1;
      if (topPercentile > 99)
        topPercentile = 99;

      return RecommendedJobDto.builder().jobId(dbJob.getId())
          .companyName(dbJob.getCompanyName() != null ? dbJob.getCompanyName() : "회사명 미상")
          .title(dbJob.getTitle())
          .region(dbJob.getLocation() != null ? dbJob.getLocation() : "위치 미상")
          .experience(dbJob.getExperienceLevel() != null ? dbJob.getExperienceLevel() : "경력무관")
          .contractType(dbJob.getContractType() != null ? dbJob.getContractType() : "정규직")
          .salary(dbJob.getSalary() != null ? dbJob.getSalary() : "회사내규에 따름")
          .url(dbJob.getHyperlink())
          .deadline(dbJob.getDeadline() != null ? dbJob.getDeadline().toString() : null)
          .matchStatus(matchStatus).topPercentile(topPercentile).matchPercentage(matchPercentage)
          .cutoffHigh(jobCutoffHigh).cutoffMedium(jobCutoffMedium).averageScore(jobAverageScore)
          .build();
    }).sorted((a, b) -> Integer.compare(a.getTopPercentile(), b.getTopPercentile())) // 상위 %가
                                                                                     // 작을수록(1%에
                                                                                     // 가까울수록) 위로 정렬
                                                                                     // (내림차순 체감)
        .collect(Collectors.toList());
  }
}
