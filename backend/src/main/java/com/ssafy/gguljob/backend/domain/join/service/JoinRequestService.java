package com.ssafy.gguljob.backend.domain.join.service;

import com.ssafy.gguljob.backend.domain.join.dto.JoinSubmitRequestDto;
import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import com.ssafy.gguljob.backend.domain.join.repository.JoinRequestRepository;
import com.ssafy.gguljob.backend.domain.join.type.JoinRequestType;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JoinRequestService {
    private final JoinRequestRepository joinRequestRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

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
        // 팀 리더인지 확인하는 로직 추가 필요

        if (joinRequestRepository.existsByProjectIdAndUserId(projectId, targetUserId)) {
            throw new IllegalArgumentException("이미 초대했거나 지원한 유저입니다.");
        }

        User targetUser = userRepository.findById(targetUserId).orElseThrow();
        Project project = projectRepository.findById(projectId).orElseThrow();

        JoinRequest joinRequest = JoinRequest.builder()
            .user(targetUser)
            .project(project)
            .positionId(positionId)
            .requestType(JoinRequestType.INVITE) 
            .appealContent("프로젝트 리더의 초대입니다.")
            .build();

        joinRequestRepository.save(joinRequest);
    }
}
