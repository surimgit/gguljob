package com.ssafy.gguljob.backend.domain.user.service;

import com.ssafy.gguljob.backend.domain.user.dto.OnboardingRequestDto;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ssafy.gguljob.backend.domain.skill.service.SkillService;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final SkillService skillService;

    public void onboardUser(Long userId, OnboardingRequestDto requestDto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        user.updateOnboarding(
            requestDto.getDescription(),
            requestDto.getPosition(),
            requestDto.getExperience(),
            requestDto.getMbti(),
            requestDto.getTeamTendency()
        );

        skillService.saveUserSkills(user, requestDto.getSkills());

        log.info("유저(ID:{}) 온보딩 기본 정보 업데이트 완료", userId);
    }
}
