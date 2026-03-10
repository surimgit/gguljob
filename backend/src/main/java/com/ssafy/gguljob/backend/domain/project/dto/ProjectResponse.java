package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ProjectResponse {

    public record Id(
        Long projectId
    ) {
        public static Id from(Project project) {
            return new Id(project.getId());
        }
    }

    // 2. 내 프로젝트 목록 조회 응답용
    public record Simple(
        Long projectId,
        String title,
        String teamName,
        String domain,
        String leaderName,
        ProjectStatus status,
        LocalDateTime finishedAt,
        String imageUrl,
        Map<String, Long> roleCounts,
        List<String> skills
    ) {
        public static Simple of(Project project, Map<String, Long> roleCounts, List<String> skills) {
            return new Simple(
                project.getId(),
                project.getTitle(),
                project.getTeamName(),
                project.getDomain(),
                project.getLeader().getUserName(),
                project.getStatus(),
                project.getFinishedAt(),
                project.getImageUrl(),
                roleCounts,
                skills
            );
        }
    }
}
