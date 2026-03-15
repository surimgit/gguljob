package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectPositionRepository extends JpaRepository<ProjectPosition, Long> {
}