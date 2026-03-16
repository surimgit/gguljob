package com.ssafy.gguljob.backend.domain.join.service;

import com.ssafy.gguljob.backend.domain.join.dto.PendingJoinRequestDto;
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
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.List;
import java.util.stream.Collectors;
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
    public void inviteUser(Long leaderId, Long projectId, Long targetUserId, PositionType role, String appealContent) {
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
            .role(role)
            .requestType(JoinRequestType.INVITE)
            .appealContent(appealContent)
            .build();

        joinRequestRepository.save(joinRequest);
    }

    // 프로젝트 합류/초대 수락 로직
    @Transactional
    public void acceptRequest(Long loginUserId, Long requestId) {
        JoinRequest joinRequest = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 요청입니다."));

        // 권한 검증
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

        ProjectPosition projectPosition = joinRequest.getPositionId() != null
            ? projectPositionRepository.findById(joinRequest.getPositionId())
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션입니다."))
            : null;

        PositionType assignedRole = projectPosition != null
            ? projectPosition.getRole()
            : joinRequest.getRole();

        ProjectMember newMember = ProjectMember.builder()
            .project(joinRequest.getProject())
            .user(joinRequest.getUser())
            .projectPosition(projectPosition) // 직접 초대는 null
            .status(MemberStatus.ATTEND)
            .role(assignedRole) // 지정된 역할 부여
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

    // 참가 신청 현황 (대기 중) 목록 조회
    @Transactional(readOnly = true)
    public List<PendingJoinRequestDto> getPendingJoinRequests(Long loginUserId, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        // 1. 리더 권한 검증
        if (!project.getLeader().getId().equals(loginUserId)) {
            throw new IllegalArgumentException("프로젝트 리더만 참가 신청 현황을 볼 수 있습니다.");
        }

        // 2. 대기 중인 요청 목록 DB에서 뽑아오기
        List<JoinRequest> pendingRequests = joinRequestRepository.findPendingRequestsByProjectId(projectId);

        // 3. DTO로 변환
        return pendingRequests.stream().map(request -> {
            String positionName = projectPositionRepository.findById(request.getPositionId())
                .map(pos -> pos.getRole().name())
                .orElse("알 수 없음");

            // 유저의 기술 스택 리스트를 가져오는 로직
            List<String> techStacks = request.getUser().getUserSkills().stream()
                .map(userSkill -> userSkill.getSkill().getName())
                .collect(Collectors.toList());

            return PendingJoinRequestDto.of(request, positionName, techStacks);
        }).collect(Collectors.toList());
    }
}
