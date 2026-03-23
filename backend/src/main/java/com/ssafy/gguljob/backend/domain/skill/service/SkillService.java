package com.ssafy.gguljob.backend.domain.skill.service;

import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import com.ssafy.gguljob.backend.domain.skill.entity.UserSkill;
import com.ssafy.gguljob.backend.domain.skill.repository.SkillRepository;
import com.ssafy.gguljob.backend.domain.skill.repository.UserSkillRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;

    public void saveUserSkills(User user, List<String> skillNames) {
        userSkillRepository.deleteAllByUser(user);

        if (skillNames == null || skillNames.isEmpty()) {
            return;
        }

        List<Skill> skills = skillRepository.findAllByNameIn(skillNames);

        if (skills.size() != skillNames.size()) {
            throw new IllegalArgumentException("DB에 존재하지 않는 기술 스택이 포함되어 있습니다.");
        }

        List<UserSkill> userSkills = skills.stream()
            .map(skill -> UserSkill.builder()
                .user(user)
                .skill(skill)
                .build())
            .toList();

        userSkillRepository.saveAll(userSkills);
        log.info("유저(ID:{}) 스킬 매핑 완료! 저장된 스킬 갯수: {}", user.getId(), userSkills.size());
    }
}