package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.github.service.GithubSyncService;
import com.ssafy.gguljob.backend.domain.project.dto.InitialPrSyncEvent;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final GithubSyncService githubSyncService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ProjectResponse.Id createProject(Long userId, ProjectRequest.Create request) {

        User leader = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("해당 ID의 사용자를 찾을 수 없습니다."));

        Project project = Project.builder()
            .leader(leader)
            .title(request.title())
            .teamName(request.teamName())
            .domain(request.domain())
            .description(request.description())
            .isPublic(request.isPublic())
            .imageUrl(request.imageUrl())
            .documentUrl(request.documentUrl())
            .build();

        Project savedProject = projectRepository.save(project);
        ProjectMember projectMember = ProjectMember.builder()
            .project(savedProject)
            .user(leader)
            .role(request.leaderRole())
            .build();

        projectMemberRepository.save(projectMember);

        return ProjectResponse.Id.from(savedProject);
    }

    public List<ProjectResponse.Simple> getMyProjects(Long userId) {

        List<ProjectMember> memberships = projectMemberRepository.findActiveProjectsByUserId(userId,
            MemberStatus.ATTEND);

        return memberships.stream().map(membership -> {
            Project project = membership.getProject();

            // 역할별 인원수 계산
            Map<String, Long> roleCounts = projectMemberRepository.countRolesByProjectId(
                    project.getId())
                .stream()
                .collect(Collectors.toMap(
                    row -> row[0].toString(),
                    row -> (Long) row[1]
                ));

            // 스킬 이름 최대 4개 조회
            List<String> allSkills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());
            List<String> skills = allSkills.stream()
                .limit(4)
                .toList();

            return ProjectResponse.Simple.of(project, roleCounts, skills);
        }).collect(Collectors.toList());
    }

    @Transactional
    public void registerGitRepository(Long userId, Long projectId, ProjectRequest.RegisterGitRepo request){

        Project project = projectRepository.findByIdAndMemberUserId(projectId, userId, MemberStatus.ATTEND)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없거나 접근 권한이 없습니다."));

        // 서버 시크릿 키 생성
        String webhookSecret = UUID.randomUUID().toString().replace("-", "");

        GitRepository gitRepository = gitRepositoryRepository.findByProject_Id(projectId)
            .orElseGet(() -> GitRepository.builder().project(project).build());

        gitRepository.updateRepoInfo(request.repoUrl(), webhookSecret);
        gitRepositoryRepository.save(gitRepository);

        // 트랜잭션을 물고 있지 않도록 이벤트를 던지고 즉시 응답
        eventPublisher.publishEvent(new InitialPrSyncEvent(
            gitRepository.getId(),
            projectId,
            request.repoUrl(),
            request.githubToken(),
            webhookSecret
        ));
    }
}
