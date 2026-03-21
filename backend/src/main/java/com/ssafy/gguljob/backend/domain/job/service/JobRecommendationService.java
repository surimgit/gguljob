package com.ssafy.gguljob.backend.domain.job.service;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
  private final ObjectMapper objectMapper = new ObjectMapper();

  public List<RecommendedJobDto> getTop3Recommendations(Long userId) {
    return getRecommendations(userId, 3, 0, false);
  }

  public List<RecommendedJobDto> getRegularRecommendations(Long userId, int skip, String sort) {
    boolean sortByDeadline = "deadline".equalsIgnoreCase(sort);
    return getRecommendations(userId, 10, skip, sortByDeadline);
  }

  private List<RecommendedJobDto> getRecommendations(Long userId, int limit, int skip,
      boolean sortByDeadline) {
    // deadline 정렬도 적합도 상위 200개 후보 안에서만 수행합니다.
    int queryLimit = limit;
    int querySkip = skip;
    if (sortByDeadline) {
      // 적합도 상위 200개를 뽑은 뒤 SQL deadline 정렬로 페이지를 자릅니다.
      querySkip = 0;
      queryLimit = 200;
    }

    Collection<JobRecommendationResponse> neo4jResults = jobRecommendationRepository
        .recommendJobsForUser(userId, queryLimit, querySkip, sortByDeadline);

    List<JobRecommendationResponse> resultList = new java.util.ArrayList<>(neo4jResults);

    if (resultList.isEmpty()) {
      return List.of();
    }

    List<Long> jobIds =
        resultList.stream().map(JobRecommendationResponse::getJobId).collect(Collectors.toList());

    if (jobIds.isEmpty()) {
      return List.of();
    }

    if (sortByDeadline) {
      Map<Long, JobRecommendationResponse> scoreMap =
          resultList.stream().collect(Collectors.toMap(JobRecommendationResponse::getJobId,
              Function.identity(), (a, b) -> a, LinkedHashMap::new));

      List<Long> candidateIds = resultList.stream().map(JobRecommendationResponse::getJobId)
          .distinct().collect(Collectors.toList());

      int page = skip / limit;
      Pageable pageable = PageRequest.of(page, limit);
      List<JobPosting> pagedByDeadline =
          jobPostingRepository.findByIdInOrderByDeadline(candidateIds, pageable);

      return pagedByDeadline.stream().map(dbJob -> {
        JobRecommendationResponse score = scoreMap.get(dbJob.getId());
        if (score == null) {
          return null;
        }

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
            .matchStatus(score.getMatchStatus()).topPercentile(score.getTopPercentile())
            .matchPercentage(score.getFinalScore()).cutoffHigh(score.getCutoffHigh())
            .cutoffMedium(score.getCutoffMedium()).averageScore(score.getAverageScore())
            .logoUrl(
                (dbJob.getLogoUrl() != null && !dbJob.getLogoUrl().isBlank()) ? dbJob.getLogoUrl()
                    : DEFAULT_LOGO_URL)
            .techStacks(parseTechStacks(dbJob.getTechStacks()))
            .jobCategory(dbJob.getJobCategory())
            .build();
      }).filter(dto -> dto != null).collect(Collectors.toList());
    } else {
      List<JobPosting> jobPostings = jobPostingRepository.findByIdIn(jobIds);

      Map<Long, JobPosting> jobMap =
          jobPostings.stream().collect(Collectors.toMap(JobPosting::getId, Function.identity()));

      List<RecommendedJobDto> dtoList =
          resultList.stream().filter(neo -> jobMap.containsKey(neo.getJobId())).map(neo -> {
            JobPosting dbJob = jobMap.get(neo.getJobId());

            String DEFAULT_LOGO_URL = "https://cdn.gguljob.com/uploads/1234abcd_default-logo.png";

            return RecommendedJobDto.builder().jobId(dbJob.getId())
                .companyName(dbJob.getCompanyName() != null ? dbJob.getCompanyName() : "회사명 미상")
                .title(dbJob.getTitle())
                .region(dbJob.getLocation() != null ? dbJob.getLocation() : "위치 미상")
                .experience(
                    dbJob.getExperienceLevel() != null ? dbJob.getExperienceLevel() : "경력무관")
                .contractType(dbJob.getContractType() != null ? dbJob.getContractType() : "정규직")
                .salary(dbJob.getSalary() != null ? dbJob.getSalary() : "회사내규에 따름")
                .url(dbJob.getHyperlink())
                .deadline(dbJob.getDeadline() != null ? dbJob.getDeadline().toString() : null)
                .matchStatus(neo.getMatchStatus()).topPercentile(neo.getTopPercentile())
                .matchPercentage(neo.getFinalScore()).cutoffHigh(neo.getCutoffHigh())
                .cutoffMedium(neo.getCutoffMedium()).averageScore(neo.getAverageScore())
                .logoUrl((dbJob.getLogoUrl() != null && !dbJob.getLogoUrl().isBlank())
                    ? dbJob.getLogoUrl()
                    : DEFAULT_LOGO_URL)
                .techStacks(parseTechStacks(dbJob.getTechStacks()))
                .jobCategory(dbJob.getJobCategory())
                .build();
          }).collect(Collectors.toList());

      // 백분위 정렬 안전 보장
      dtoList.sort((a, b) -> Integer.compare(a.getTopPercentile(), b.getTopPercentile()));
      return dtoList;
    }
  }

  private List<String> parseTechStacks(String raw) {
    if (raw == null || raw.isBlank()) return Collections.emptyList();
    try {
      return objectMapper.readValue(raw, new TypeReference<List<String>>() {});
    } catch (Exception e) {
      return Arrays.stream(raw.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .collect(Collectors.toList());
    }
  }
}
