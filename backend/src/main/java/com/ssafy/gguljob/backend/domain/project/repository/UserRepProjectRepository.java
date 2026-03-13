package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.UserRepProject;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepProjectRepository extends JpaRepository<UserRepProject, Long> {
    List<UserRepProject> findByUserId(Long userId);
}
