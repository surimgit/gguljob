package com.ssafy.gguljob.backend.domain.user.service;

import com.ssafy.gguljob.backend.domain.skill.repository.UserSkillRepository;
import com.ssafy.gguljob.backend.domain.user.dto.OnboardingRequestDto;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.redis.RedisService;
import jakarta.persistence.EntityNotFoundException;
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

    private final UserSkillRepository userSkillRepository;
    private final RedisService redisService;

    public void onboardUser(Long userId, OnboardingRequestDto requestDto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("유저를 찾을 수 없습니다."));

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

    public void withdrawUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("이미 탈퇴했거나 없는 유저입니다."));

        userSkillRepository.deleteAllByUser(user);

        userRepository.delete(user);

        redisService.deleteValues("RT:" + userId);

        log.info("유저(ID:{}) 회원 탈퇴 및 데이터 영구 삭제 완료", userId);
    }
}
