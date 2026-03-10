package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.skill.entity.ProjectSkill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {

    // 스킬 가져오기 (최대 4개)
    @Query("SELECT s.name FROM ProjectSkill ps JOIN ps.skill s " +
        "WHERE ps.project.id = :projectId")
    List<String> findTop4SkillNamesByProjectId(@Param("projectId") Long projectId, Pageable pageable);
}