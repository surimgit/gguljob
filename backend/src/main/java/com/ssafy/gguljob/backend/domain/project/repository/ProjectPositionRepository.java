package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectPositionRepository extends JpaRepository<ProjectPosition, Long> {
    // 특정 프로젝트의 모집 포지션 목록 가져오기
    List<ProjectPosition> findAllByProjectId(Long projectId);

    Optional<ProjectPosition> findByIdAndProjectId(Long id, Long projectId);
}