package com.ssafy.gguljob.backend.domain.skill.repository;

import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findAllByNameIn(List<String> names);
    List<Skill> findByNameIn(List<String> names);
}
