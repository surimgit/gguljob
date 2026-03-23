package com.ssafy.gguljob.backend.domain.job.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PagedRecommendationResponse {

  private List<RecommendedJobDto> content;
  private int totalPages;
  private long totalElements;
  private int currentPage;
  private int size;
}
