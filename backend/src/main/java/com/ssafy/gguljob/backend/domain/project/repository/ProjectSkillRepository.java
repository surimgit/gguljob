package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.skill.entity.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {

    // 스킬 이름 조회
    @Query("SELECT s.name FROM ProjectSkill ps JOIN ps.skill s WHERE ps.project.id = :projectId")
    List<String> findAllSkillNamesByProjectId(@Param("projectId") Long projectId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProjectSkill ps WHERE ps.project.id = :projectId")
    void deleteAllByProjectId(@Param("projectId") Long projectId);

    List<ProjectSkill> findAllByProjectId(Long projectId);
}