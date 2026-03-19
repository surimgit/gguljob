package com.ssafy.gguljob.backend.domain.job.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.gguljob.backend.domain.job.dto.response.RecommendedJobDto;
import com.ssafy.gguljob.backend.domain.job.service.JobRecommendationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobRecommendationController {

  private final JobRecommendationService jobRecommendationService;

  @GetMapping("/recommend/top")
  public ResponseEntity<List<RecommendedJobDto>> getTop3RecommendedJobs(
      @RequestParam(name = "userId", defaultValue = "5") Long userId) {
    // TODO: SecurityContext에서 실제 사용자 ID를 추출하여 사용하도록 수정해야 함.
    List<RecommendedJobDto> response = jobRecommendationService.getTop3Recommendations(userId);
    return ResponseEntity.ok(response);
  }

  @GetMapping
  public ResponseEntity<List<RecommendedJobDto>> getRegularRecommendedJobs(
      @RequestParam(name = "page", defaultValue = "1") int page,
      @RequestParam(name = "sort", defaultValue = "recommend") String sort,
      @RequestParam(name = "userId", defaultValue = "5") Long userId) {
    // TODO: SecurityContext에서 실제 사용자 ID를 추출하여 사용하도록 수정해야 함.

    // AI 일반 추천 목록: 페이지당 10개
    int skip = (page - 1) * 10;

    List<RecommendedJobDto> response =
        jobRecommendationService.getRegularRecommendations(userId, skip, sort);
    return ResponseEntity.ok(response);
  }
}
