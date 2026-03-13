package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.project.dto.InitialPrSyncEvent;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest.ProjectUpdateRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectUpdateResponse;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import com.ssafy.gguljob.backend.domain.skill.entity.ProjectSkill;
import com.ssafy.gguljob.backend.domain.skill.repository.SkillRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final SkillRepository skillRepository;
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

    // =========================================================================
    // 🌟 마이페이지 위젯용: 가장 최근에 참여한 진행 중 프로젝트 딱 1개 조회
    // =========================================================================
    public ProjectResponse.Simple getMyRepProject(Long userId) {
        // (주의: findFirstBy... 쿼리메서드는 ProjectMemberRepository에 추가하셔야 합니다!)
        Optional<ProjectMember> repMemberOpt = projectMemberRepository
            .findFirstByUserIdAndProjectStatusOrderByProjectCreatedAtDesc(userId, ProjectStatus.RECRUITING); // 형님 기본값이 RECRUITING이길래 맞췄습니다!

        if (repMemberOpt.isEmpty()) {
            return null; // 참여 중인 프로젝트 없으면 깔끔하게 null 리턴
        }

        Project project = repMemberOpt.get().getProject();

        // 형님 스타일 그대로 적용 (역할 카운트 + 스킬 4개)
        Map<String, Long> roleCounts = projectMemberRepository.countRolesByProjectId(project.getId())
            .stream().collect(Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));

        List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId())
            .stream().limit(4).toList();

        return ProjectResponse.Simple.of(project, roleCounts, skills);
    }

    public ProjectResponse.UpdateFormInfo getUpdateForm(Long projectId, Long currentUserId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        if (!project.getLeader().getId().equals(currentUserId)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        List<Long> skillIds = projectSkillRepository.findAllByProjectId(projectId).stream()
            .map(ps -> ps.getSkill().getId())
            .toList();

        List<ProjectMember> existingMembers = projectMemberRepository.findAllByProjectIdAndStatus(projectId, MemberStatus.ATTEND);
        List<ProjectResponse.UpdateFormInfo.MemberDto> members = existingMembers.stream()
            .map(pm -> new ProjectResponse.UpdateFormInfo.MemberDto(
                pm.getUser().getId(),
                pm.getUser().getUserName(),
                pm.getRole()
            ))
            .toList();

        return new ProjectResponse.UpdateFormInfo(
            project.getStatus().name(), project.getTitle(),
            project.getTeamName(),
            project.getDescription(),
            project.getDomain(),
            skillIds,
            members
        );

    }

    @Transactional
    public void registerGitRepository(Long userId, Long projectId, ProjectRequest.RegisterGitRepo request){

        Project project = projectRepository.findByIdAndMemberUserId(projectId, userId, MemberStatus.ATTEND)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없거나 접근 권한이 없습니다."));

        // 중복 등록 방지
        Optional<GitRepository> existingRepoOpt = gitRepositoryRepository.findByProject_Id(projectId);
        if (existingRepoOpt.isPresent() && existingRepoOpt.get().getRepoUrl().equals(request.repoUrl())) {
            throw new IllegalArgumentException("이미 동일한 깃허브 레포지토리가 등록되어 있습니다.");
        }

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

    // 프로젝트 업데이트
    @Transactional
    public ProjectUpdateResponse updateProject(Long projectId, ProjectUpdateRequest request, Long currentUserId) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        if (!project.getLeader().getId().equals(currentUserId)) {
            throw new AccessDeniedException("프로젝트 수정 권한이 없습니다.");
        }

        // 기본 정보 업데이트
        project.updateBasicInfo(request.title(), request.teamName(), request.description(), request.domain(), request.status());

        // 기술 스택 & 팀원 동기화
        syncProjectSkills(project, request.skillIds());
        syncProjectMembers(project, request.members());

        projectRepository.save(project);

        return ProjectUpdateResponse.from(project);
    }

    private void syncProjectSkills(Project project, List<Long> requestedSkillIds) {
        projectSkillRepository.deleteAllByProjectId(project.getId());

        if (requestedSkillIds != null && !requestedSkillIds.isEmpty()) {
            List<ProjectSkill> newSkills = requestedSkillIds.stream()
                .map(skillId -> ProjectSkill.builder()
                    .project(project)
                    .skill(skillRepository.getReferenceById(skillId))
                    .build())
                .toList();
            projectSkillRepository.saveAll(newSkills);
        }
    }

    private void syncProjectMembers(Project project, List<ProjectRequest.MemberDto> requestedMembers) {
        Long projectId = project.getId();

        List<ProjectMember> existingMembers = projectMemberRepository.findAllByProjectIdAndStatus(projectId, MemberStatus.ATTEND);

        Set<Long> existingUserIds = existingMembers.stream()
            .map(m -> m.getUser().getId())
            .collect(Collectors.toSet());

        Set<Long> requestedUserIds = requestedMembers.stream()
            .map(ProjectRequest.MemberDto::userId)
            .collect(Collectors.toSet());

        // 삭제 대상 (기존 O, 요청 X)
        List<Long> userIdsToRemove = existingUserIds.stream()
            .filter(id -> !requestedUserIds.contains(id))
            .toList();

        if (!userIdsToRemove.isEmpty()) {
            projectMemberRepository.bulkUpdateStatusToLeave(projectId, userIdsToRemove);
        }

        // 추가 대상 (기존 X, 요청 O)
        List<ProjectMember> membersToAdd = requestedMembers.stream()
            .filter(dto -> !existingUserIds.contains(dto.userId()))
            .map(dto -> ProjectMember.builder()
                .project(project)
                .user(userRepository.getReferenceById(dto.userId()))
                .role(dto.role())
                .status(MemberStatus.ATTEND)
                .build())
            .toList();

        if (!membersToAdd.isEmpty()) {
            projectMemberRepository.saveAll(membersToAdd);
        }
    }
}
