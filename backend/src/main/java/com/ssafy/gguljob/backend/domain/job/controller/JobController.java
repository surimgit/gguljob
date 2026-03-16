package com.ssafy.gguljob.backend.domain.job.controller;

import com.ssafy.gguljob.backend.domain.job.dto.JobBookmarkResponseDto;
import com.ssafy.gguljob.backend.domain.job.service.JobBookmarkService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "채용공고 API", description = "채용공고 조회 및 북마크 관련 API")
public class JobController {

    private final JobBookmarkService jobBookmarkService;

    //채용공고 북마크 토글
    @Operation(summary = "채용공고 북마크 토글", description = "채용공고를 찜하거나 찜 해제합니다.")
    @PostMapping("/{jobId}/bookmarks")
    public ResponseEntity<ApiResponseDto<Boolean>> toggleJobBookmark(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long jobId) {

        boolean isBookmarked = jobBookmarkService.toggleBookmark(userDetails.getId(), jobId);

        String message = isBookmarked ? "채용공고 북마크가 추가되었습니다." : "채용공고 북마크가 해제되었습니다.";
        return ResponseEntity.ok(new ApiResponseDto<>(200, message, isBookmarked));
    }

    // 내 채용공고 북마크 목록 조회
    @Operation(summary = "내 채용공고 북마크 목록 조회", description = "내가 찜한 채용공고 목록을 페이지네이션하여 조회합니다.")
    @GetMapping("/bookmarks")
    public ResponseEntity<ApiResponseDto<Page<JobBookmarkResponseDto>>> getMyBookmarkedJobs(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @ParameterObject @PageableDefault(size = 10) Pageable pageable) {

        Page<JobBookmarkResponseDto> response = jobBookmarkService.getMyBookmarkedJobs(userDetails.getId(), pageable);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "북마크 목록 조회가 완료되었습니다.", response));
    }
}