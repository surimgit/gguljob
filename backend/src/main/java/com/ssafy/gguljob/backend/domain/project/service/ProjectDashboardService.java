package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.repository.TroubleshootingRepository;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.GitLog;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectDashboardService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final TroubleshootingRepository troubleshootingRepository;
    private final PullRequestRepository pullRequestRepository;
    private final GitRepositoryRepository gitRepositoryRepository;

    private void validateAccess(Project project, Long userId){
        if(Boolean.TRUE.equals(project.getIsPublic())){
            return;
        }
        if(userId == null){
            throw new IllegalArgumentException("비공개 프로젝트입니다. 로그인 후 이용해주세요.");
        }

        boolean isAttendingMember = projectMemberRepository.existsByProject_IdAndUser_IdAndStatus(
            project.getId(), userId, MemberStatus.ATTEND
        );

        if(!isAttendingMember){
            throw new IllegalArgumentException("해당 프로젝트를 조회할 권한이 없습니다.");
        }

    }

    // 대시보드 헤더 정보
    @Transactional(readOnly = true)
    public ProjectResponse.TeamDashboard getTeamDashboard(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다"));

        validateAccess(project, userId);

        // 스킬 조회
        List<String> skillNames = projectSkillRepository.findAllSkillNamesByProjectId(projectId);
        ProjectResponse.ProjectOverviewDto projectInfo = new ProjectResponse.ProjectOverviewDto(
            project.getTitle(), project.getTeamName(), project.getDomain(), project.getDescription(), skillNames
        );

        // 팀원 통계
        List<String> activeRoles = projectMemberRepository.findRolesByProjectIdAndStatus(projectId, MemberStatus.ATTEND);
        long totalMembers = activeRoles.size();
        Map<String, Long> roleCounts = activeRoles.stream()
            .collect(Collectors.groupingBy(
                role -> role,
                Collectors.counting()
            ));

        // PR 통계
        long totalTroubleshootings = troubleshootingRepository.countByProject_Id(projectId);
        long totalCommits = pullRequestRepository.countByProject_Id(projectId);

        ProjectResponse.TeamStatsDto statsDto = new ProjectResponse.TeamStatsDto(
            (int) totalMembers, roleCounts, totalCommits, totalTroubleshootings
        );

        // Git Repo
        Optional<GitRepository> gitRepoOpt = gitRepositoryRepository.findByProject_Id(projectId);
        ProjectResponse.GitRepoDto gitRepoInfo = null;

        if (gitRepoOpt.isPresent()) {
            GitRepository gitRepo = gitRepoOpt.get();
            String lastSyncTime = "최근 업데이트 됨";

            gitRepoInfo = new ProjectResponse.GitRepoDto(gitRepo.getRepoUrl(), lastSyncTime);
        }

        return new ProjectResponse.TeamDashboard(projectInfo, statsDto, gitRepoInfo);
    }

    // 활동 로그 (MR 랭킹 + 최근 활동)
    @Transactional(readOnly = true)
    public ProjectResponse.GitLog getGitLog(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다"));

        validateAccess(project, userId);

        // MR 랭킹
        var rankingProjections = pullRequestRepository.findMrRankingByProjectId(projectId, PageRequest.of(0, 5));
        List<ProjectResponse.MrRankingDto> rankings = new ArrayList<>();
        int rank = 1;
        for (var proj : rankingProjections) {
            rankings.add(new ProjectResponse.MrRankingDto(
                rank++,
                proj.getUserId(),
                proj.getUserName(),
                proj.getProfileImageUrl(),
                proj.getMrCount()
            ));
        }

        // 최근 활동 내역
        List<ProjectResponse.ActivityLogDto> top5Activities = pullRequestRepository
            .findTop5ByProject_IdOrderByCreatedAtDesc(projectId)
            .stream()
            .map(pr -> new ProjectResponse.ActivityLogDto(
                pr.getUser().getUserName(),
                pr.getUser().getImageUrl(),
                pr.getTitle(),
                pr.getBranchName(),
                pr.getCreatedAt(),
                "PR"
            ))
            .toList();

        return new GitLog(rankings, top5Activities);
    }
}
