package com.ssafy.gguljob.backend.domain.skill.repository;

import com.ssafy.gguljob.backend.domain.skill.entity.UserSkill;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    // 기존 기술 스택 초괴화용(프로필 수정할 때 다시 덮어쓰기 위해)
    void deleteAllByUser(User user);
}