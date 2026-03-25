package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.type.Domain;
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

    // 내 프로젝트 목록 조회 응답용
    public record Simple(
        Long projectId,
        String title,
        String teamName,
        String description,
        Domain domain,
        String leaderName,
        String leaderProfileImageUrl,
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
                project.getDescription(),
                project.getDomain(),
                project.getLeader().getUserName(),
                project.getLeader().getProfileImageUrl(),
                project.getStatus(),
                project.getFinishedAt(),
                project.getImageUrl(),
                roleCounts,
                skills
            );
        }
    }

    // 프로젝트 상세 dashboard 응답
    public record TeamDashboard(
        ProjectOverviewDto projectInfo,
        TeamStatsDto teamStats,
        GitRepoDto gitRepoInfo
    ) {}

    public record ProjectOverviewDto(
        String title,
        String topic,
        String teamName,
        Domain domain,
        String description,
        List<String> skills,
        ProjectStatus status
    ) {}

    public record TeamStatsDto(
        int totalMembers,
        Map<String, Long> roleCounts, // {"FE": 3, "BE": 2}
        long totalCommits,
        long totalTroubleshootings
    ) {}

    public record GitRepoDto(
        String repoUrl,
        String lastSyncTime
    ) {}

    // gitlog 응답
    public record GitLog(
        List<MrRankingDto> mrRankings,
        List<ActivityLogDto> recentActivities
    ) {}

    public record MrRankingDto(
        int rank,
        Long userId,
        String userName,
        String profileImageUrl,
        long mrCount
    ) {}

    public record ActivityLogDto(
        String userName,
        String profileImageUrl,
        String content,  // MR 제목
        String label, // 브랜치명
        LocalDateTime createdAt,
        String activityType
    ) {}

    // 수정 폼 초기 세팅용 데이터
    public record UpdateFormInfo(
        String status,
        String title,
        String teamName,
        String description,
        Domain domain,
        List<Long> skillIds,
        List<MemberDto> members,
        String imageUrl
    ) {
        public record MemberDto(
            Long userId,
            String userName,
            com.ssafy.gguljob.backend.domain.user.type.PositionType role
        ) {}
    }

    public record ProjectUpdateResponse(
        Long projectId,
        String teamName,
        String title,
        ProjectStatus status
    ) {
        public static ProjectUpdateResponse from(Project project) {
            return new ProjectUpdateResponse(
                project.getId(),
                project.getTeamName(),
                project.getTitle(),
                project.getStatus()
            );
        }
    }

    // 추천 프로젝트 카드 디자인용
    public record ProjectCardDto(
        Long projectId,
        Domain domain,
        ProjectStatus status,
        String title,
        String description,
        List<String> skills,
        List<PositionStatusDto> positions,
        String leaderName,
        String leaderProfileImageUrl,
        String imageUrl,
        Long score // Neo4j 매칭 스코어
    ) {
        // Neo4j에서 계산된 점수를 덮어씌우기 위한 메서드
        public ProjectCardDto withScore(Long score) {
            return new ProjectCardDto(projectId, domain, status, title, description, skills, positions, leaderName, leaderProfileImageUrl, imageUrl, score);
        }
    }

    public record PositionStatusDto(
        Long positionId,
        String role,
        int currentCount,
        int targetCount
    ) {}

    public record GitRepoRegistered(
        String webhookSecret
    ) {}
}
