package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.project.dto.ProjectMemberResponse;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional
    public ProjectMemberResponse.ProjectLeaveResponse leaveProject(Long projectId, Long userId) {

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트의 멤버가 아닙니다."));

        // 멤버 상태 -> LEAVE
        member.leaveProject();

        // 팀장인 경우 가장 오래된 ATTEND 멤버 위임
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
            throw new IllegalArgumentException("본인을 내보낼 수 없습니다. 팀 나가기 기능을 이용해주세요.");
        }

        // 프로젝트 조회 및 리더 권한 검증
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        if (!project.getLeader().getId().equals(leaderId)) {
            throw new SecurityException("팀장만 팀원을 내보낼 수 있습니다.");
        }

        // 내보내기
        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트의 멤버가 아닙니다."));

        if (targetMember.getStatus() == MemberStatus.REVOKE) {
            throw new IllegalStateException("이미 나간 팀원입니다.");
        }

        targetMember.revokeProject();

        return new ProjectMemberResponse.ProjectKickResponse(
            projectId,
            targetUserId,
            "해당 팀원을 성공적으로 내보냈습니다."
        );
    }
}
