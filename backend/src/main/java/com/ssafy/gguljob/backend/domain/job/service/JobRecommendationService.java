package com.ssafy.gguljob.backend.domain.job.service;

import com.ssafy.gguljob.backend.domain.job.dto.response.JobRecommendationResponse;
import com.ssafy.gguljob.backend.domain.job.dto.response.RecommendedJobDto;
import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import com.ssafy.gguljob.backend.domain.job.repository.JobPostingRepository;
import com.ssafy.gguljob.backend.domain.job.repository.JobRecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    Collection<JobRecommendationResponse> neo4jResults = jobRecommendationRepository.recommendJobsForUser(userId, limit, skip);

    List<Long> jobIds = neo4jResults.stream()
        .map(JobRecommendationResponse::getJobId)
        .collect(Collectors.toList());

    if (jobIds.isEmpty()) {
      return List.of();
    }

    List<JobPosting> jobPostings = jobPostingRepository.findByIdIn(jobIds);

    Map<Long, JobPosting> jobMap = jobPostings.stream()
        .collect(Collectors.toMap(JobPosting::getId, Function.identity()));

    return neo4jResults.stream()
        .filter(neo -> jobMap.containsKey(neo.getJobId()))
        .map(neo -> {
          JobPosting dbJob = jobMap.get(neo.getJobId());
          
          double matchPercentage = neo.getFinalScore() * 100.0;
          
          String matchStatus;
          if (matchPercentage >= 70) {
            matchStatus = "적합";
          } else if (matchPercentage >= 40) {
            matchStatus = "보통";
          } else {
            matchStatus = "부족";
          }

          return RecommendedJobDto.builder()
              .jobId(dbJob.getId())
              .companyName(dbJob.getCompanyName() != null ? dbJob.getCompanyName() : "회사명 미상")
              .title(dbJob.getTitle())
              .region("위치정보 없음") // 엔티티에 위치 정보가 명확하지 않아 임시 처리
              .experience(dbJob.getExperienceLevel() != null ? dbJob.getExperienceLevel() : "경력무관")
              .contractType("정규직") // 계약형태도 명확하지 않아 임시 처리
              .salary(dbJob.getSalary() != null ? dbJob.getSalary() : "회사내규에 따름")
              .matchStatus(matchStatus)
              .matchPercentage(matchPercentage)
              .build();
        })
        .collect(Collectors.toList());
  }
}
