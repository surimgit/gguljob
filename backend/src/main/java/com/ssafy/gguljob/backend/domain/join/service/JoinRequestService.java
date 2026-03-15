package com.ssafy.gguljob.backend.domain.join.service;

import com.ssafy.gguljob.backend.domain.join.dto.JoinSubmitRequestDto;
import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import com.ssafy.gguljob.backend.domain.join.event.JoinRequestEvent;
import com.ssafy.gguljob.backend.domain.join.repository.JoinRequestRepository;
import com.ssafy.gguljob.backend.domain.join.type.JoinRequestType;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JoinRequestService {
    private final JoinRequestRepository joinRequestRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    private final ProjectPositionRepository projectPositionRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ApplicationEventPublisher eventPublisher;

    // 유저 -> 프로젝트 지원
    @Transactional
    public void applyProject(Long userId, Long projectId, Long positionId, String appealContent) {
        if (joinRequestRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new IllegalArgumentException("이미 해당 프로젝트에 지원했거나 초대받은 상태입니다.");
        }

        User user = userRepository.findById(userId).orElseThrow();
        Project project = projectRepository.findById(projectId).orElseThrow();

        JoinRequest joinRequest = JoinRequest.builder()
            .user(user)
            .project(project)
            .positionId(positionId)
            .requestType(JoinRequestType.APPLY)
            .appealContent(appealContent)
            .build();

        joinRequestRepository.save(joinRequest);
    }

    // 팀 리더 -> 유저 초대
    @Transactional
    public void inviteUser(Long leaderId, Long projectId, Long targetUserId, Long positionId) {
        Project project = projectRepository.findById(projectId).orElseThrow();

        // 초대 권한 검증 (리더만 초대 가능)
        if (!project.getLeader().getId().equals(leaderId)) {
            throw new IllegalArgumentException("프로젝트 리더만 팀원을 초대할 수 있습니다.");
        }

        if (joinRequestRepository.existsByProjectIdAndUserId(projectId, targetUserId)) {
            throw new IllegalArgumentException("이미 초대했거나 지원한 유저입니다.");
        }

        User targetUser = userRepository.findById(targetUserId).orElseThrow();

        JoinRequest joinRequest = JoinRequest.builder()
            .user(targetUser)
            .project(project)
            .positionId(positionId)
            .requestType(JoinRequestType.INVITE)
            .appealContent("프로젝트 리더의 초대입니다.")
            .build();

        joinRequestRepository.save(joinRequest);
    }

    @Transactional
    public void acceptRequest(Long loginUserId, Long requestId) {
        JoinRequest joinRequest = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 요청입니다."));

        // 권한 빡세게 검증
        if (joinRequest.getRequestType() == JoinRequestType.APPLY) {
            if (!joinRequest.getProject().getLeader().getId().equals(loginUserId)) {
                throw new IllegalArgumentException("프로젝트 리더만 수락할 수 있습니다.");
            }
        } else if (joinRequest.getRequestType() == JoinRequestType.INVITE) {
            if (!joinRequest.getUser().getId().equals(loginUserId)) {
                throw new IllegalArgumentException("본인에게 온 초대만 수락할 수 있습니다.");
            }
        }

        joinRequest.accept();

        ProjectPosition projectPosition = projectPositionRepository.findById(joinRequest.getPositionId())
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션입니다."));

        ProjectMember newMember = ProjectMember.builder()
            .project(joinRequest.getProject())
            .user(joinRequest.getUser())
            .projectPosition(projectPosition)
            .status(MemberStatus.ATTEND)
            .role(projectPosition.getRole())
            .build();
        projectMemberRepository.save(newMember);

        Long targetNotifyUserId = (joinRequest.getRequestType() == JoinRequestType.APPLY)
            ? joinRequest.getUser().getId()
            : joinRequest.getProject().getLeader().getId();

        String message = (joinRequest.getRequestType() == JoinRequestType.APPLY)
            ? "축하합니다! 프로젝트 합류가 수락되었습니다."
            : joinRequest.getUser().getUserName() + "님이 초대를 수락했습니다.";

        eventPublisher.publishEvent(new JoinRequestEvent(
            targetNotifyUserId, joinRequest.getProject().getId(), message, "JOIN_ACCEPT"
        ));
    }

    // 프로젝트 합류/초대 거절 로직
    @Transactional
    public void rejectRequest(Long loginUserId, Long requestId) {
        JoinRequest joinRequest = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 요청입니다."));

        // 권한 검증 (수락 로직과 동일)
        if (joinRequest.getRequestType() == JoinRequestType.APPLY) {
            if (!joinRequest.getProject().getLeader().getId().equals(loginUserId)) {
                throw new IllegalArgumentException("프로젝트 리더만 거절할 수 있습니다.");
            }
        } else if (joinRequest.getRequestType() == JoinRequestType.INVITE) {
            if (!joinRequest.getUser().getId().equals(loginUserId)) {
                throw new IllegalArgumentException("본인에게 온 초대만 거절할 수 있습니다.");
            }
        }

        // 상태를 REJECTED로 변경
        joinRequest.reject();

        // 알림 이벤트 발행
        Long targetNotifyUserId = (joinRequest.getRequestType() == JoinRequestType.APPLY)
            ? joinRequest.getUser().getId()
            : joinRequest.getProject().getLeader().getId();

        String message = (joinRequest.getRequestType() == JoinRequestType.APPLY)
            ? "프로젝트 합류가 거절되었습니다."
            : joinRequest.getUser().getUserName() + "님이 초대를 거절했습니다.";

        eventPublisher.publishEvent(new JoinRequestEvent(
            targetNotifyUserId, joinRequest.getProject().getId(), message, "JOIN_REJECT"
        ));
    }
}
