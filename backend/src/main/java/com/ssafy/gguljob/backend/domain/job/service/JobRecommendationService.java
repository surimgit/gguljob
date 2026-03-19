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
    return getRecommendations(userId, 3, 0, false);
  }

  public List<RecommendedJobDto> getRegularRecommendations(Long userId, int skip, String sort) {
    boolean sortByDeadline = "deadline".equalsIgnoreCase(sort);
    return getRecommendations(userId, 10, skip, sortByDeadline);
  }

  private List<RecommendedJobDto> getRecommendations(Long userId, int limit, int skip,
      boolean sortByDeadline) {
    // 상대평가 백분위(topPercentile) 및 마감일 정렬을 위해 항상 200개를 가져와서 메모리 정렬 후 페이징합니다.
    int neo4jLimit = 200;
    int neo4jSkip = 0;

    Collection<JobRecommendationResponse> neo4jResults =
        jobRecommendationRepository.recommendJobsForUser(userId, neo4jLimit, neo4jSkip);

    List<Long> jobIds =
        neo4jResults.stream().map(JobRecommendationResponse::getJobId).collect(Collectors.toList());

    if (jobIds.isEmpty()) {
      return List.of();
    }

    List<JobPosting> jobPostings = jobPostingRepository.findByIdIn(jobIds);

    Map<Long, JobPosting> jobMap =
        jobPostings.stream().collect(Collectors.toMap(JobPosting::getId, Function.identity()));

    List<RecommendedJobDto> dtoList =
        neo4jResults.stream().filter(neo -> jobMap.containsKey(neo.getJobId())).map(neo -> {
          JobPosting dbJob = jobMap.get(neo.getJobId());

          double matchPercentage = Math.round(neo.getFinalScore() * 10.0) / 10.0;
          double jobAverageScore = Math.round(neo.getAverageScore() * 10.0) / 10.0;

          double jobCutoffHigh =
              Math.round((neo.getCutoffHigh() != null ? neo.getCutoffHigh() : 70.0) * 10.0) / 10.0;
          double jobCutoffMedium =
              Math.round((neo.getCutoffMedium() != null ? neo.getCutoffMedium() : 40.0) * 10.0)
                  / 10.0;

          String matchStatus;
          int topPercentile;

          if (matchPercentage >= jobCutoffHigh) {
            matchStatus = "적합";
            double ratio =
                jobCutoffHigh >= 100.0 ? 0 : (100.0 - matchPercentage) / (100.0 - jobCutoffHigh);
            topPercentile = (int) Math.max(1, Math.round(30.0 * ratio));
          } else if (matchPercentage >= jobCutoffMedium) {
            matchStatus = "보통";
            double diff = jobCutoffHigh - jobCutoffMedium;
            double ratio = diff <= 0 ? 0 : (jobCutoffHigh - matchPercentage) / diff;
            topPercentile = (int) Math.max(31, Math.round(30.0 + 30.0 * ratio));
          } else {
            matchStatus = "부족";
            double ratio =
                jobCutoffMedium <= 0 ? 0 : (jobCutoffMedium - matchPercentage) / jobCutoffMedium;
            topPercentile = (int) Math.min(99, Math.round(60.0 + 40.0 * ratio));
          }

          if (topPercentile < 1)
            topPercentile = 1;
          if (topPercentile > 99)
            topPercentile = 99;

          String DEFAULT_LOGO_URL = "https://cdn.gguljob.com/uploads/1234abcd_default-logo.png";

          return RecommendedJobDto.builder().jobId(dbJob.getId())
              .companyName(dbJob.getCompanyName() != null ? dbJob.getCompanyName() : "회사명 미상")
              .title(dbJob.getTitle())
              .region(dbJob.getLocation() != null ? dbJob.getLocation() : "위치 미상")
              .experience(dbJob.getExperienceLevel() != null ? dbJob.getExperienceLevel() : "경력무관")
              .contractType(dbJob.getContractType() != null ? dbJob.getContractType() : "정규직")
              .salary(dbJob.getSalary() != null ? dbJob.getSalary() : "회사내규에 따름")
              .url(dbJob.getHyperlink())
              .deadline(dbJob.getDeadline() != null ? dbJob.getDeadline().toString() : null)
              .matchStatus(matchStatus).topPercentile(topPercentile)
              .matchPercentage(matchPercentage).cutoffHigh(jobCutoffHigh)
              .cutoffMedium(jobCutoffMedium).averageScore(jobAverageScore)
              .logoUrl(
                  (dbJob.getLogoUrl() != null && !dbJob.getLogoUrl().isBlank()) ? dbJob.getLogoUrl()
                      : DEFAULT_LOGO_URL)
              .build();
        }).collect(Collectors.toList());

    if (sortByDeadline) {
      dtoList.sort((a, b) -> {
        if (a.getDeadline() == null && b.getDeadline() == null)
          return Integer.compare(a.getTopPercentile(), b.getTopPercentile());
        if (a.getDeadline() == null)
          return 1;
        if (b.getDeadline() == null)
          return -1;
        return a.getDeadline().compareTo(b.getDeadline());
      });
    } else {
      dtoList.sort((a, b) -> Integer.compare(a.getTopPercentile(), b.getTopPercentile()));
    }

    int toIndex = Math.min(skip + limit, dtoList.size());
    if (skip >= dtoList.size()) {
      return List.of();
    }
    return dtoList.subList(skip, toIndex);
  }
}
