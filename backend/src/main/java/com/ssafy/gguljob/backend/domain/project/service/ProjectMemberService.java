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
}
