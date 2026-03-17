package com.ssafy.gguljob.backend.domain.job.dto;

import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class JobBookmarkResponseDto {
    private Long jobId;
    private String companyName;
    private String title;
    private LocalDateTime deadline;

    public static JobBookmarkResponseDto from(JobPosting jobPosting) {
        return JobBookmarkResponseDto.builder()
            .jobId(jobPosting.getId())
            .companyName(jobPosting.getCompanyName())
            .title(jobPosting.getTitle())
            .deadline(jobPosting.getDeadline())
            .build();
    }
}