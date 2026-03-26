package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.join.repository.JoinRequestRepository;
import com.ssafy.gguljob.backend.domain.matching.event.ProjectSyncEvent;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.repository.UserRepProjectRepository;
import com.ssafy.gguljob.backend.domain.troubleshooting.repository.TroubleshootingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectDeletionService {

    private final ProjectRepository projectRepository;
    private final UserRepProjectRepository userRepProjectRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final TroubleshootingRepository troubleshootingRepository;
    private final PullRequestRepository pullRequestRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final ProjectPositionRepository projectPositionRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void deleteProjectWithRelations(Project project, Long actorUserId) {
        Long projectId = project.getId();

        userRepProjectRepository.deleteAllByProjectId(projectId);
        joinRequestRepository.deleteAllByProjectId(projectId);
        troubleshootingRepository.deleteAllByProjectId(projectId);
        pullRequestRepository.deleteAllByProjectId(projectId);
        gitRepositoryRepository.deleteAllByProjectId(projectId);
        projectPositionRepository.deleteAllByProjectId(projectId);
        projectMemberRepository.deleteAllByProjectId(projectId);
        projectSkillRepository.deleteAllByProjectId(projectId);

        projectRepository.delete(project);

        eventPublisher.publishEvent(new ProjectSyncEvent(projectId));

        log.info("프로젝트 삭제 완료 - projectId: {}, actorUserId: {}", projectId, actorUserId);
    }
}
