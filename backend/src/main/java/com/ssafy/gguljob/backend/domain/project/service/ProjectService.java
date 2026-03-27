package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.ai.repository.ChatLogRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PrReviewRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.service.GithubSyncService;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;
import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import com.ssafy.gguljob.backend.domain.troubleshooting.repository.TroubleshootingRepository;
import com.ssafy.gguljob.backend.domain.join.dto.PendingJoinRequestDto;
import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import com.ssafy.gguljob.backend.domain.join.repository.JoinRequestRepository;
import com.ssafy.gguljob.backend.domain.matching.event.ProjectSyncEvent;
import com.ssafy.gguljob.backend.domain.matching.event.UserProfileSyncEvent;
import com.ssafy.gguljob.backend.domain.project.dto.CurrentMemberDto;
import com.ssafy.gguljob.backend.domain.project.dto.InitialPrSyncEvent;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectFilterResponseDto;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest.ProjectUpdateRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectUpdateResponse;
import com.ssafy.gguljob.backend.domain.project.dto.RecruitmentStatusDto;
import com.ssafy.gguljob.backend.domain.project.dto.TeamManagementResponseDto;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.entity.UserRepProject;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.UserRepProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import com.ssafy.gguljob.backend.domain.skill.entity.ProjectSkill;
import com.ssafy.gguljob.backend.domain.skill.repository.SkillRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import com.ssafy.gguljob.backend.global.exception.ForbiddenException;
import com.ssafy.gguljob.backend.global.infra.s3.S3ImageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final ProjectPositionRepository projectPositionRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final GithubSyncService githubSyncService;
    private final UserRepProjectRepository userRepProjectRepository;
    private final TroubleshootingRepository troubleshootingRepository;
    private final PullRequestRepository pullRequestRepository;
    private final PrReviewRepository prReviewRepository;
    private final ChatLogRepository chatLogRepository;
    private final S3ImageService s3ImageService;
    private final ProjectDeletionService projectDeletionService;

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
            .build();

        Project savedProject = projectRepository.save(project);
        ProjectMember projectMember = ProjectMember.builder()
            .project(savedProject)
            .user(leader)
            .role(request.leaderRole())
            .build();

        projectMemberRepository.save(projectMember);

        log.info("Neo4j로 전송 시작");
        eventPublisher.publishEvent(new ProjectSyncEvent(savedProject.getId()));

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

            // 스킬 이름 전체 조회 (프론트에서 표시 개수 제어)
            List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());

            return ProjectResponse.Simple.of(project, roleCounts, skills);
        }).collect(Collectors.toList());
    }

    // 마이페이지 위젯용: 사용자가 설정한 대표 프로젝트 조회 (최대 2개)
    public List<ProjectResponse.Simple> getMyRepProjects(Long userId) {
        List<UserRepProject> repProjectEntities = userRepProjectRepository
            .findByUserIdWithProject(userId);

        if (repProjectEntities.isEmpty()) {
            return List.of();
        }

        return repProjectEntities.stream().limit(2).map(rep -> {
            Project project = rep.getProject();

            Map<String, Long> roleCounts = projectMemberRepository.countRolesByProjectId(project.getId())
                .stream().collect(Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));

            List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());

            return ProjectResponse.Simple.of(project, roleCounts, skills);
        }).toList();
    }

    public ProjectResponse.UpdateFormInfo getUpdateForm(Long projectId, Long currentUserId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        if (!project.getLeader().getId().equals(currentUserId)) {
            throw new ForbiddenException("수정 권한이 없습니다.");
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
            members,
            project.getImageUrl()
        );

    }

    @Transactional
    public ProjectResponse.GitRepoRegistered registerGitRepository(Long userId, Long projectId, ProjectRequest.RegisterGitRepo request) {

        Project project = projectRepository.findByIdAndMemberUserId(projectId, userId, MemberStatus.ATTEND)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없거나 접근 권한이 없습니다."));

        // repoUrl이 다른 프로젝트에 이미 등록되어 있는지 검사
        gitRepositoryRepository.findByRepoUrl(request.repoUrl()).ifPresent(existing -> {
            if (existing.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("이미 동일한 레포지토리가 등록되어 있습니다.");
            }
            throw new IllegalArgumentException("이미 다른 프로젝트에 등록된 레포지토리입니다.");
        });

        // 기존 레포가 있고 URL이 변경되면 연관 데이터 삭제 (FK 의존 순서)
        Optional<GitRepository> existingRepoOpt = gitRepositoryRepository.findByProject_Id(projectId);
        if (existingRepoOpt.isPresent()) {
            GitRepository existingRepo = existingRepoOpt.get();
            if (!existingRepo.getRepoUrl().equals(request.repoUrl())) {
                log.info("🔄 레포 변경 감지 (기존: {} → 신규: {}). 기존 데이터를 삭제합니다.", existingRepo.getRepoUrl(), request.repoUrl());
                chatLogRepository.deleteAllByProject_Id(projectId);
                troubleshootingRepository.deleteAllByProjectId(projectId);
                prReviewRepository.deleteAllByPullRequest_Project_Id(projectId);
                pullRequestRepository.deleteAllByProjectId(projectId);
            }
        }

        // README 동기화 (실패해도 등록은 계속 진행)
        try {
            String[] urlParts = request.repoUrl().replace("https://github.com/", "").split("/");
            if (urlParts.length >= 2) {
                String owner = urlParts[0];
                String repo = urlParts[1].replace(".git", "");
                String readme = githubSyncService.fetchReadmeFromGithub(owner, repo, request.githubToken());
                if (readme != null && !readme.isBlank()) {
                    project.updateReadme(readme);
                    log.info("🚀 프로젝트 ID {}에 README 업데이트 완료", projectId);
                    eventPublisher.publishEvent(new UserProfileSyncEvent(userId));
                }
            }
        } catch (Exception e) {
            log.warn("❌ README 가져오기 실패 (등록은 계속 진행): {}", e.getMessage());
        }

        // 기존 엔티티 업데이트 또는 신규 생성
        String webhookSecret = UUID.randomUUID().toString().replace("-", "");
        GitRepository gitRepository = existingRepoOpt
            .orElseGet(() -> GitRepository.builder().project(project).build());

        gitRepository.updateRepoInfo(request.repoUrl(), webhookSecret);
        gitRepositoryRepository.save(gitRepository);

        eventPublisher.publishEvent(new InitialPrSyncEvent(
            gitRepository.getId(), projectId, request.repoUrl(), request.githubToken(), webhookSecret
        ));

        return new ProjectResponse.GitRepoRegistered(webhookSecret);
    }

    @Transactional
    public void disconnectGitRepository(Long userId, Long projectId) {
        projectRepository.findByIdAndMemberUserId(projectId, userId, MemberStatus.ATTEND)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없거나 접근 권한이 없습니다."));

        // FK 의존 순서대로 삭제: ChatLog → Troubleshooting → PrReview → PullRequest → GitRepository
        chatLogRepository.deleteAllByProject_Id(projectId);
        troubleshootingRepository.deleteAllByProjectId(projectId);
        prReviewRepository.deleteAllByPullRequest_Project_Id(projectId);
        pullRequestRepository.deleteAllByProjectId(projectId);
        gitRepositoryRepository.deleteAllByProjectId(projectId);

        log.info("✅ 프로젝트 ID {} 의 Git 레포지토리 연동이 해제되었습니다.", projectId);
    }

    // 프로젝트 업데이트
    @Transactional
    public ProjectUpdateResponse updateProject(Long projectId, ProjectUpdateRequest request, Long currentUserId) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        if (!project.getLeader().getId().equals(currentUserId)) {
            throw new ForbiddenException("프로젝트 수정 권한이 없습니다.");
        }

        // 기본 정보 업데이트
        project.updateBasicInfo(request.title(), request.teamName(), request.description(), request.domain(), request.status());

        // 기술 스택 & 팀원 동기화
        syncProjectSkills(project, request.skillIds());
        syncProjectMembers(project, request.members());

        projectRepository.save(project);

        eventPublisher.publishEvent(new ProjectSyncEvent(project.getId()));

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

    // 팀원 관리 페이지 종합 데이터 조회
    @Transactional(readOnly = true)
    public TeamManagementResponseDto getTeamManagementDetail(Long loginUserId, Long projectId) {

        // 프로젝트 조회 & 리더 권한 검증
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        boolean isMember = projectMemberRepository.existsByProject_IdAndUser_IdAndStatus(
            projectId, loginUserId, MemberStatus.ATTEND
        );
        if (!isMember) {
            throw new IllegalArgumentException("프로젝트 멤버만 팀원 정보를 조회할 수 있습니다.");
        }

        boolean isLeader = project.getLeader().getId().equals(loginUserId);

        List<ProjectPosition> positions = projectPositionRepository.findAllByProjectId(projectId);

        Map<Long, String> positionMap = positions.stream()
            .collect(Collectors.toMap(ProjectPosition::getId, p -> p.getRole().name()));

        // 팀원 모집 현황 리스트
        List<RecruitmentStatusDto> recruitments = positions.stream()
            .map(position -> {
                List<String> skillNames = List.of();
                if (position.getRequireSkills() != null && !position.getRequireSkills().isEmpty()) {
                    List<Long> skillIds = Arrays.stream(position.getRequireSkills().split(","))
                        .map(String::trim)
                        .map(Long::parseLong)
                        .collect(Collectors.toList());
                    skillNames = skillRepository.findAllById(skillIds).stream()
                        .map(Skill::getName)
                        .collect(Collectors.toList());
                }
                return RecruitmentStatusDto.of(position, skillNames);
            })
            .collect(Collectors.toList());

        // 현재 팀원 리스트
        List<CurrentMemberDto> currentMembers = projectMemberRepository.findAllByProjectIdAndStatus(projectId, MemberStatus.ATTEND).stream()
            .map(CurrentMemberDto::from)
            .collect(Collectors.toList());

        // 참가 신청 현황
        List<JoinRequest> pendingRequestsEntities = joinRequestRepository.findPendingRequestsByProjectId(projectId);
        List<PendingJoinRequestDto> pendingRequests = pendingRequestsEntities.stream()
            .map(request -> {
                String positionName = request.getPositionId() != null
                    ? positionMap.getOrDefault(request.getPositionId(), "UNKNOWN")
                    : "미지정";

                List<String> techStacks = request.getUser().getUserSkills().stream()
                    .map(userSkill -> userSkill.getSkill().getName())
                    .collect(Collectors.toList());

                return PendingJoinRequestDto.of(request, positionName, techStacks);
            })
            .collect(Collectors.toList());

        return TeamManagementResponseDto.builder()
            .isLeader(isLeader)
            .leaderId(project.getLeader().getId())
            .recruitments(recruitments)
            .currentMembers(currentMembers)
            .pendingRequests(pendingRequests)
            .build();
    }

    // Neo4j에서 받은 ID 리스트로 화면에 뿌릴 카드 데이터들을 묶어주는 로직
    public Map<Long, ProjectResponse.ProjectCardDto> getProjectCardsMap(List<Long> projectIds) {
        if (projectIds.isEmpty()) return java.util.Collections.emptyMap();

        // 프로젝트 기본 정보
        List<Project> projects = projectRepository.findAllWithLeaderByIdIn(projectIds);

        // 스킬 뱃지 정보 (IN 쿼리로 N+1 방지)
        Map<Long, List<String>> skillMap = projectSkillRepository.findByProjectIdIn(projectIds).stream()
            .collect(Collectors.groupingBy(
                ps -> ps.getProject().getId(),
                Collectors.mapping(ps -> ps.getSkill().getName(), Collectors.toList())
            ));

        // 포지션별 모집 인원 정보
        Map<Long, List<ProjectResponse.PositionStatusDto>> positionMap = projectPositionRepository.findByProjectIdIn(projectIds).stream()
            .collect(Collectors.groupingBy(
                pp -> pp.getProject().getId(),
                Collectors.mapping(pp -> new ProjectResponse.PositionStatusDto(
                    pp.getId(), pp.getRole().name(), pp.getCurrentCount(), pp.getTargetCount()), Collectors.toList())
            ));

        return projects.stream().collect(Collectors.toMap(
            Project::getId,
            p -> new ProjectResponse.ProjectCardDto(
                p.getId(), p.getDomain(), p.getStatus(), p.getTitle(), p.getDescription(),
                skillMap.getOrDefault(p.getId(), java.util.Collections.emptyList()),
                positionMap.getOrDefault(p.getId(), java.util.Collections.emptyList()),
                p.getLeader().getUserName(), p.getLeader().getProfileImageUrl(),
                p.getImageUrl(),
                0L // 점수는 MatchingService에서 나중에 채움
            )
        ));
    }

    public List<ProjectResponse.ProjectCardDto> getTopProjects(Long userId) {
        List<Project> topProjects;

        if (userId != null) {
            List<Long> joinedProjectIds = projectMemberRepository
                .findActiveProjectsByUserId(userId, MemberStatus.ATTEND)
                .stream()
                .map(pm -> pm.getProject().getId())
                .toList();

            if (!joinedProjectIds.isEmpty()) {
                topProjects = projectRepository.findTop50ByStatusAndIdNotInOrderByCreatedAtDesc(ProjectStatus.RECRUITING, joinedProjectIds);
            } else {
                topProjects = projectRepository.findTop50ByStatusOrderByCreatedAtDesc(ProjectStatus.RECRUITING);
            }
        } else {
            topProjects = projectRepository.findTop50ByStatusOrderByCreatedAtDesc(ProjectStatus.RECRUITING);
        }

        if (topProjects.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<Long> projectIds = topProjects.stream().map(Project::getId).toList();
        Map<Long, ProjectResponse.ProjectCardDto> cardMap = getProjectCardsMap(projectIds);

        return topProjects.stream()
            .map(p -> cardMap.get(p.getId()))
            .filter(java.util.Objects::nonNull)
            .filter(card -> card.status() == ProjectStatus.RECRUITING)
            .filter(card -> card.positions().stream()
                .anyMatch(pos -> pos.currentCount() < pos.targetCount()))
            .toList();
    }

    public ProjectFilterResponseDto getProjectFilters() {

        // 도메인
        List<ProjectFilterResponseDto.FilterOptionDto> domains = java.util.Arrays.stream(com.ssafy.gguljob.backend.domain.project.type.Domain.values())
            .map(domain -> new ProjectFilterResponseDto.FilterOptionDto(domain.name(), domain.getDescription()))
            .toList();

        // 직무 (PositionType 9개 기준)
        List<ProjectFilterResponseDto.FilterOptionDto> roles = java.util.Arrays.stream(PositionType.values())
            .map(positionType -> new ProjectFilterResponseDto.FilterOptionDto(
                positionType.name(),
                toProjectFilterRoleLabel(positionType)
            ))
            .toList();

        List<ProjectFilterResponseDto.SkillCategoryDto> skillCategories = skillRepository.findAll().stream()
            .collect(java.util.stream.Collectors.groupingBy(
                skill -> skill.getCategory().name(),
                java.util.stream.Collectors.mapping(
                    skill -> new ProjectFilterResponseDto.SkillDto(skill.getId(), skill.getName()),
                    java.util.stream.Collectors.toList()
                )
            ))
            .entrySet().stream()
            .map(entry -> new ProjectFilterResponseDto.SkillCategoryDto(entry.getKey(), entry.getValue()))
            .toList();

        return new ProjectFilterResponseDto(domains, roles, skillCategories);
    }

    private String toProjectFilterRoleLabel(PositionType positionType) {
        if (positionType == null) {
            return "";
        }
        return switch (positionType) {
            case FE -> "FE 모집중";
            case BE -> "BE 모집중";
            default -> positionType.getDescription() + " 모집중";
        };
    }

    @Transactional
    public void applyRecommendedTopic(Long projectId, Long userId, String selectedTopic) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(userId)) {
            throw new IllegalStateException("프로젝트 팀장만 주제를 변경할 수 있습니다.");
        }

        project.updateTopic(selectedTopic);
    }

    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(userId)) {
            throw new ForbiddenException("프로젝트 삭제는 팀장만 가능합니다.");
        }
        projectDeletionService.deleteProjectWithRelations(project, userId);
    }

    @Transactional
    public String uploadProjectImage(Long projectId, Long userId, MultipartFile file) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(userId)) {
            throw new ForbiddenException("프로젝트 이미지 수정은 팀장만 가능합니다.");
        }

        // 기존 이미지 S3 키 보관 (트랜잭션 커밋 후 삭제 위해)
        String oldS3Key = null;
        if (project.getImageUrl() != null) {
            oldS3Key = s3ImageService.extractS3Key(project.getImageUrl());
        }

        // S3 업로드 → CDN URL 생성 → DB 업데이트 (먼저 커밋)
        String s3Key = s3ImageService.uploadImage(file);
        String fullImageUrl = s3ImageService.getImageUrl(s3Key);
        project.updateImageUrl(fullImageUrl);
        projectRepository.flush();

        // DB 커밋 성공 후 기존 이미지 S3 삭제 (실패해도 고아 파일만 남음)
        if (oldS3Key != null) {
            try {
                s3ImageService.deleteObject(oldS3Key);
                log.info("프로젝트 ID {} 기존 이미지 S3 삭제 완료: {}", projectId, oldS3Key);
            } catch (Exception e) {
                log.warn("프로젝트 ID {} 기존 이미지 S3 삭제 실패 (고아 파일): {}", projectId, oldS3Key, e);
            }
        }

        return fullImageUrl;
    }

    @Transactional
    public void deleteProjectImage(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(userId)) {
            throw new ForbiddenException("프로젝트 이미지 삭제는 팀장만 가능합니다.");
        }

        if (project.getImageUrl() != null) {
            String s3Key = s3ImageService.extractS3Key(project.getImageUrl());

            // DB 먼저 null 처리 (트랜잭션 보장)
            project.updateImageUrl(null);
            projectRepository.flush();

            // DB 커밋 성공 후 S3 삭제 (실패해도 고아 파일만 남음)
            try {
                s3ImageService.deleteObject(s3Key);
                log.info("프로젝트 ID {} 이미지 S3 삭제 완료: {}", projectId, s3Key);
            } catch (Exception e) {
                log.warn("프로젝트 ID {} 이미지 S3 삭제 실패 (고아 파일): {}", projectId, s3Key, e);
            }
        }
    }

    // 프로젝트 팀원 목록 조회
    @Transactional(readOnly = true)
    public List<ProjectResponse.ProjectMemberDto> getProjectMembers(Long loginUserId, Long projectId) {
        projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        boolean isMember = projectMemberRepository.existsByProject_IdAndUser_IdAndStatus(
            projectId, loginUserId, MemberStatus.ATTEND
        );
        if (!isMember) {
            throw new ForbiddenException("프로젝트 멤버만 팀원 목록을 조회할 수 있습니다.");
        }

        return projectMemberRepository.findAllByProjectIdAndStatus(projectId, MemberStatus.ATTEND).stream()
            .map(pm -> new ProjectResponse.ProjectMemberDto(
                pm.getId(),
                pm.getUser().getId(),
                pm.getRole().name(),
                pm.getUser().getUserName(),
                pm.getUser().getProfileImageUrl()
            ))
            .collect(Collectors.toList());
    }
}
