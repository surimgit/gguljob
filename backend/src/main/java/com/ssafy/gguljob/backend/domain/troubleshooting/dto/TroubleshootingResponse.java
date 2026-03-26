package com.ssafy.gguljob.backend.domain.troubleshooting.dto;

import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

public class TroubleshootingResponse {

    @Getter
    @Builder
    public static class Widget {
        private Long tsId;
        private String title;
        private String solution;
        private LocalDateTime createdAt;

        public static Widget from(Troubleshooting ts) {
            return Widget.builder()
                .tsId(ts.getId())
                .title(ts.getTitle())
                .solution(ts.getSolution())
                .createdAt(ts.getCreatedAt())
                .build();
        }
    }

    @Getter
    @Builder
    public static class ListItem {
        private Long tsId;
        private String title;
        private String description;
        private String solution;
        private String codeSnippet;
        private Long projectId;
        private String projectName;
        private LocalDateTime createdAt;

        public static ListItem from(Troubleshooting ts) {
            return ListItem.builder()
                .tsId(ts.getId())
                .title(ts.getTitle())
                .description(ts.getSituation())
                .solution(ts.getSolution())
                .codeSnippet(ts.getCodeSnippet())
                .projectId(ts.getProject().getId())
                .projectName(ts.getProject().getTitle())
                .createdAt(ts.getCreatedAt())
                .build();
        }
    }

    public record GenerateResult(
        String title,
        String trouble,
        String shooting,
        String codeSnippet,
        String confidence,
        String prTitle,
        Integer prNumber
    ) {}
}
