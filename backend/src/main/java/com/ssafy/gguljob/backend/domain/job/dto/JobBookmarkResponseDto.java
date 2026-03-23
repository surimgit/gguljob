package com.ssafy.gguljob.backend.domain.job.dto;

import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Builder
public class JobBookmarkResponseDto {
    private Long jobId;
    private String companyName;
    private String title;
    private String region;
    private String experience;
    private String contractType;
    private String salary;
    private String url;
    private LocalDateTime deadline;
    private String jobCategory;
    private List<String> techStacks;
    private String logoUrl;

    public static JobBookmarkResponseDto from(JobPosting jobPosting) {
        return JobBookmarkResponseDto.builder()
            .jobId(jobPosting.getId())
            .companyName(jobPosting.getCompanyName())
            .title(jobPosting.getTitle())
            .region(jobPosting.getLocation())
            .experience(jobPosting.getExperienceLevel())
            .contractType(jobPosting.getContractType())
            .salary(jobPosting.getSalary())
            .url(jobPosting.getHyperlink())
            .deadline(jobPosting.getDeadline())
            .jobCategory(jobPosting.getJobCategory())
            .techStacks(parseTechStacks(jobPosting.getTechStacks()))
            .logoUrl(jobPosting.getLogoUrl())
            .build();
    }

    private static List<String> parseTechStacks(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        return Arrays.stream(raw.replaceAll("[\\[\\]\"]", "").split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
