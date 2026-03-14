package com.ssafy.gguljob.backend.domain.join.service;

import com.ssafy.gguljob.backend.domain.join.dto.JoinSubmitRequestDto;
import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import com.ssafy.gguljob.backend.domain.join.repository.JoinRequestRepository;
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

    @Transactional
    public void submitJoinRequest(Long userId, Long projectId, JoinSubmitRequestDto requestDto) {
        // 중복 지원 검증
        if (joinRequestRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new IllegalArgumentException("이미 해당 프로젝트에 지원하셨습니다.");
        }

        //  유저 & 프로젝트 객체 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        // 3. 지원서 생성 및 저장
        JoinRequest joinRequest = JoinRequest.builder()
            .user(user)
            .project(project)
            .positionId(requestDto.getPositionId())
            .requestType(requestDto.getRequestType())
            .appealContent(requestDto.getAppealContent())
            .build();

        joinRequestRepository.save(joinRequest);
    }
}
