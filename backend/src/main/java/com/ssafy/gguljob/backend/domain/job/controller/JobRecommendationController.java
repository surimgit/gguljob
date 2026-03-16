package com.ssafy.gguljob.backend.domain.job.controller;

import com.ssafy.gguljob.backend.domain.job.dto.response.RecommendedJobDto;
import com.ssafy.gguljob.backend.domain.job.service.JobRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs/recommended")
@RequiredArgsConstructor
public class JobRecommendationController {

  private final JobRecommendationService jobRecommendationService;

  @GetMapping("/top")
  public ResponseEntity<List<RecommendedJobDto>> getTop3RecommendedJobs() {
    // TODO: SecurityContext에서 실제 사용자 ID를 추출하여 사용하도록 수정해야 함.
    Long tempUserId = 1L; 
    List<RecommendedJobDto> response = jobRecommendationService.getTop3Recommendations(tempUserId);
    return ResponseEntity.ok(response);
  }

  @GetMapping
  public ResponseEntity<List<RecommendedJobDto>> getRegularRecommendedJobs(@RequestParam(defaultValue = "1") int page) {
    // TODO: SecurityContext에서 실제 사용자 ID를 추출하여 사용하도록 수정해야 함.
    Long tempUserId = 1L; 

    // page는 1부터 시작한다고 가정 (Top3가 0~2번 인덱스, 일반 리스트 첫 페이지가 3~12번 인덱스라고 가정)
    // 혹은 일반 리스트와 Top3가 완전히 독립적인 페이징이라면 로직 수정 필요.
    // 여기서는 Top 3를 제외한 3번 인덱스부터 보여주기 위해 skip을 조절한다고 가정합니다.
    int skip = 3 + (page - 1) * 10;
    
    List<RecommendedJobDto> response = jobRecommendationService.getRegularRecommendations(tempUserId, skip);
    return ResponseEntity.ok(response);
  }
}
