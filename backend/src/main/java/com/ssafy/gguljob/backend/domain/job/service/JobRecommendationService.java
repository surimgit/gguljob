package com.ssafy.gguljob.backend.domain.job.service;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.ssafy.gguljob.backend.domain.job.dto.response.JobRecommendationResponse;
import com.ssafy.gguljob.backend.domain.job.dto.response.PagedRecommendationResponse;
import com.ssafy.gguljob.backend.domain.job.dto.response.RecommendedJobDto;
import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import com.ssafy.gguljob.backend.domain.job.repository.JobPostingRepository;
import com.ssafy.gguljob.backend.domain.job.repository.JobRecommendationRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.domain.user.type.WorkExperienceYear;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobRecommendationService {

  private final JobRecommendationRepository jobRecommendationRepository;
  private final JobPostingRepository jobPostingRepository;
  private final UserRepository userRepository;
  private final ObjectMapper objectMapper;

  private static final List<String> BASE_LEVELS = List.of("신입", "신입·경력", "경력무관", "경력");

  private List<String> getAllowedLevels(WorkExperienceYear exp) {
    if (exp == null) return null; // null이면 필터 없음
    return switch (exp) {
      case NEWCOMER -> concat(BASE_LEVELS, "경력 1년 이상"); // 신입 + 1년 버퍼
      case ONE_TO_THREE -> concat(BASE_LEVELS, "경력 1년 이상", "경력 2년 이상", "경력 3년 이상",
          "경력 4년 이상", "경력 5년 이상"); // 3년 + 2년 버퍼
      case FOUR_TO_SIX -> concat(BASE_LEVELS, "경력 1년 이상", "경력 2년 이상", "경력 3년 이상",
          "경력 4년 이상", "경력 5년 이상", "경력 6년 이상", "경력 7년 이상", "경력 8년 이상"); // 6년 + 2년 버퍼
      case MORE_THAN_SEVEN -> null; // 7년 이상은 전부 허용
    };
  }

  private List<String> concat(List<String> base, String... extra) {
    List<String> result = new java.util.ArrayList<>(base);
    result.addAll(java.util.Arrays.asList(extra));
    return result;
  }

  private WorkExperienceYear getUserWorkExperience(Long userId) {
    return userRepository.findById(userId).map(User::getWorkExperience).orElse(null);
  }

  @Cacheable(value = "allJobsScoring", key = "#a0")
  public List<RecommendedJobDto> getAllJobsWithScoring(Long userId) {
    Collection<JobRecommendationResponse> neo4jResults =
        jobRecommendationRepository.getAllJobsWithScoring(userId);

    List<JobRecommendationResponse> resultList = new java.util.ArrayList<>(neo4jResults);

    if (resultList.isEmpty()) {
      return List.of();
    }

    List<Long> jobIds =
        resultList.stream().map(JobRecommendationResponse::getJobId).collect(Collectors.toList());

    List<String> allowedLevels = getAllowedLevels(getUserWorkExperience(userId));
    List<JobPosting> jobPostings = (allowedLevels != null)
        ? jobPostingRepository.findByIdInAndExperienceLevelIn(jobIds, allowedLevels)
        : jobPostingRepository.findByIdIn(jobIds);
    Map<Long, JobPosting> jobMap =
        jobPostings.stream().collect(Collectors.toMap(JobPosting::getId, Function.identity()));

    List<RecommendedJobDto> allResults =
        resultList.stream().filter(neo -> jobMap.containsKey(neo.getJobId())).map(neo -> {
          JobPosting dbJob = jobMap.get(neo.getJobId());
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
              .matchStatus(neo.getMatchStatus()).topPercentile(neo.getTopPercentile())
              .matchPercentage(neo.getFinalScore()).cutoffTop(neo.getCutoffTop())
              .cutoffHigh(neo.getCutoffHigh()).cutoffMedium(neo.getCutoffMedium())
              .cutoffLow(neo.getCutoffLow()).averageScore(neo.getAverageScore())
              .logoUrl((dbJob.getLogoUrl() != null && !dbJob.getLogoUrl().isBlank()) ? dbJob.getLogoUrl()
                  : DEFAULT_LOGO_URL)
              .techStacks(parseTechStacks(dbJob.getTechStacks()))
              .jobCategory(dbJob.getJobCategory())
              .build();
        }).collect(Collectors.toList());

    allResults.sort((a, b) -> {
      int cmp = Integer.compare(a.getTopPercentile(), b.getTopPercentile());
      if (cmp != 0) return cmp;
      int cmp2 = Double.compare(b.getMatchPercentage(), a.getMatchPercentage());
      if (cmp2 != 0) return cmp2;
      return Long.compare(a.getJobId(), b.getJobId());
    });
    return allResults;
  }

  public List<RecommendedJobDto> getTop3Recommendations(Long userId) {
    List<RecommendedJobDto> all = getAllJobsWithScoring(userId);
    return all.size() <= 3 ? all : all.subList(0, 3);
  }

  public PagedRecommendationResponse getRegularRecommendations(Long userId, int page, int size,
      String sort) {
    if (size < 1) size = 10;
    if (page < 1) page = 1;

    boolean sortByDeadline = "deadline".equalsIgnoreCase(sort);
    List<String> allowedLevels = getAllowedLevels(getUserWorkExperience(userId));

    List<RecommendedJobDto> allCandidates;
    if (sortByDeadline) {
      // 전체 스캔 후 RDB deadline 정렬 (getAllJobsWithScoring이 이미 경력 필터 적용)
      List<RecommendedJobDto> all = getAllJobsWithScoring(userId);
      List<Long> allIds = all.stream().map(RecommendedJobDto::getJobId).collect(Collectors.toList());
      Map<Long, RecommendedJobDto> scoreMap = all.stream()
          .collect(Collectors.toMap(RecommendedJobDto::getJobId, Function.identity()));

      List<JobPosting> deadlineSorted = (allowedLevels != null)
          ? jobPostingRepository.findByIdInAndExperienceLevelInOrderByDeadline(allIds, allowedLevels)
          : jobPostingRepository.findByIdInOrderByDeadline(allIds);

      allCandidates = deadlineSorted.stream()
          .map(j -> scoreMap.get(j.getId()))
          .filter(dto -> dto != null)
          .collect(Collectors.toList());
    } else {
      // getAllJobsWithScoring이 이미 경력 필터 적용된 결과를 반환
      allCandidates = getAllJobsWithScoring(userId);
    }

    long totalElements = allCandidates.size();
    int totalPages = (int) Math.ceil((double) totalElements / size);

    int fromIndex = Math.min((page - 1) * size, allCandidates.size());
    int toIndex = Math.min(fromIndex + size, allCandidates.size());
    List<RecommendedJobDto> pageContent = allCandidates.subList(fromIndex, toIndex);

    return new PagedRecommendationResponse(pageContent, totalPages, totalElements, page, size);
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
