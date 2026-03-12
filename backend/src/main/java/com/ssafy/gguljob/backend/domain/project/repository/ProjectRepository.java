package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT p FROM Project p JOIN ProjectMember pm ON p.id = pm.project.id " +
        "WHERE p.id = :projectId AND pm.user.id = :userId AND pm.status = :status")
    Optional<Project> findByIdAndMemberUserId(
        @Param("projectId") Long projectId,
        @Param("userId") Long userId,
        @Param("status") MemberStatus status
    );
}