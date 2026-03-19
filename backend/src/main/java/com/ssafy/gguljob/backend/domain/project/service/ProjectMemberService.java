package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.project.dto.ProjectMemberResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRecruitmentDto;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import com.ssafy.gguljob.backend.domain.skill.repository.SkillRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.global.exception.BadRequestException;
import com.ssafy.gguljob.backend.global.exception.ForbiddenException;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ssafy.gguljob.backend.domain.matching.event.ProjectSyncEvent;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectPositionRepository projectPositionRepository;
    private final SkillRepository skillRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ProjectMemberResponse.ProjectLeaveResponse leaveProject(Long projectId, Long userId) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트의 멤버가 아닙니다."));

        if (member.getStatus() == MemberStatus.LEAVE || member.getStatus() == MemberStatus.REVOKE) {
            throw new BadRequestException("이미 탈퇴했거나 내보내진 상태입니다.");
        }

        // 멤버 상태 -> LEAVE
        member.leaveProject();
        Long newLeaderId = null;

        if (project.getLeader().getId().equals(userId)) {
            projectMemberRepository.findFirstByProjectIdAndStatusAndUserIdNotOrderByCreatedAtAsc(projectId,
                    MemberStatus.ATTEND, userId)
                .ifPresentOrElse(
                    nextLeader -> {
                        project.changeLeader(nextLeader.getUser());
                    },
                    () -> {
                        // 남은 팀원이 없는 경우 DONE
                        project.markAsDone();
                    }
                );
            newLeaderId = project.getLeader().getId().equals(userId) ? null : project.getLeader().getId();
        }

        String message = (newLeaderId != null) ? "팀을 성공적으로 나갔으며, 리더 권한이 위임되었습니다." : "팀을 성공적으로 나갔습니다.";

        return new ProjectMemberResponse.ProjectLeaveResponse(projectId, userId, newLeaderId, message);
    }

    @Transactional
    public ProjectMemberResponse.ProjectKickResponse kickMember(Long projectId, Long leaderId, Long targetUserId) {

        // 자기 자신을 내보내려 할 경우 차단
        if (leaderId.equals(targetUserId)) {
            throw new BadRequestException("본인을 내보낼 수 없습니다. 팀 나가기 기능을 이용해주세요.");
        }

        // 프로젝트 조회 및 리더 권한 검증
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(leaderId)) {
            throw new ForbiddenException("팀장만 팀원을 내보낼 수 있습니다.");
        }

        // 내보내기
        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
            .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트의 멤버가 아닙니다."));

        if (targetMember.getStatus() == MemberStatus.REVOKE) {
            throw new BadRequestException("이미 나간 팀원입니다.");
        }

        targetMember.revokeProject();

        return new ProjectMemberResponse.ProjectKickResponse(
            projectId,
            targetUserId,
            "해당 팀원을 성공적으로 내보냈습니다."
        );
    }

    @Transactional
    public ProjectRecruitmentDto.CreateResponse createRecruitment(
        Long projectId, Long userId, ProjectRecruitmentDto.CreateRequest request) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(userId)) {
            throw new ForbiddenException("팀장만 모집 공고를 생성할 수 있습니다.");
        }

        // 배열 -> Skill 테이블의 키로 변경
        String skillsString = null;
        if (request.requireSkills() != null && !request.requireSkills().isEmpty()) {

            List<String> cleanRequestedSkills = request.requireSkills().stream()
                .map(String::trim)
                .toList();

            List<Skill> validSkills = skillRepository.findByNameIn(cleanRequestedSkills);

            if (validSkills.size() != cleanRequestedSkills.size()) {
                List<String> foundNames = validSkills.stream()
                    .map(Skill::getName)
                    .toList();

                List<String> missingSkills = cleanRequestedSkills.stream()
                    .filter(name -> !foundNames.contains(name))
                    .toList();

                throw new BadRequestException("DB에 등록되지 않은 스킬 이름이 포함되어 있습니다: " + missingSkills);
            }

            skillsString = validSkills.stream()
                .map(skill -> String.valueOf(skill.getId()))
                .collect(Collectors.joining(","));
        }

        ProjectPosition newPosition = ProjectPosition.builder()
            .project(project)
            .role(request.role())
            .targetCount(request.targetCount() != null ? request.targetCount() : 1)
            .requireSkills(skillsString)
            .build();

        ProjectPosition savedPosition = projectPositionRepository.save(newPosition);

        eventPublisher.publishEvent(new ProjectSyncEvent(projectId));

        return new ProjectRecruitmentDto.CreateResponse(
            savedPosition.getId(),
            savedPosition.getRole(),
            savedPosition.getTargetCount(),
            "성공적으로 팀원 모집 공고를 등록했습니다."
        );
    }

    @Transactional
    public ProjectRecruitmentDto.UpdateResponse updateStatus(
        Long projectId, Long positionId, Long userId, ProjectRecruitmentDto.UpdateStatusRequest request) {

        // 자격 검증
        ProjectPosition position = getValidPositionAndCheckLeader(projectId, positionId, userId);

        // 상태 변경
        position.changeStatus(request.status());

        eventPublisher.publishEvent(new ProjectSyncEvent(projectId));

        return new ProjectRecruitmentDto.UpdateResponse(
            position.getId(), position.getStatus(), position.getTargetCount(), "모집 상태가 변경되었습니다."
        );
    }

    @Transactional
    public ProjectRecruitmentDto.UpdateResponse updateTargetCount(
        Long projectId, Long positionId, Long userId, ProjectRecruitmentDto.UpdateCountRequest request) {

        // 자격 검증
        ProjectPosition position = getValidPositionAndCheckLeader(projectId, positionId, userId);
        if (request.targetCount() < position.getCurrentCount()) {
            throw new BadRequestException("목표 모집 인원은 현재 합류한 인원(" + position.getCurrentCount() + "명)보다 적을 수 없습니다.");
        }

        // 인원 변경
        position.changeTargetCount(request.targetCount());

        eventPublisher.publishEvent(new ProjectSyncEvent(projectId));

        return new ProjectRecruitmentDto.UpdateResponse(
            position.getId(), position.getStatus(), position.getTargetCount(), "모집 인원이 변경되었습니다."
        );
    }

    private ProjectPosition getValidPositionAndCheckLeader(Long projectId, Long positionId, Long userId) {
        ProjectPosition position = projectPositionRepository.findByIdAndProjectId(positionId, projectId)
            .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트에 존재하지 않는 모집 공고입니다."));

        if (!position.getProject().getLeader().getId().equals(userId)) {
            throw new ForbiddenException("팀장만 모집 공고를 수정할 수 있습니다.");
        }
        return position;
    }

    @Transactional
    public ProjectMemberResponse.DelegateResponse delegateLeader(Long projectId, Long currentLeaderId, Long targetUserId) {

        if (currentLeaderId.equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신에게 팀장을 위임할 수 없습니다.");
        }

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(currentLeaderId)) {
            throw new IllegalStateException("팀장 위임 권한이 없습니다. (현재 팀장이 아님)");
        }

        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("위임 대상자가 프로젝트에 참여 중인 팀원이 아닙니다."));

        if (targetMember.getStatus() != MemberStatus.ATTEND) {
            throw new IllegalStateException("해당 팀원은 현재 프로젝트에 정상적으로 참여(ATTEND) 중인 상태가 아닙니다.");
        }

        User newLeader = targetMember.getUser();
        project.changeLeader(newLeader);

        return ProjectMemberResponse.DelegateResponse.builder()
            .projectId(projectId)
            .previousLeaderId(currentLeaderId)
            .newLeaderId(targetUserId)
            .build();
    }
}
