package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.project " +
        "WHERE pm.user.id = :userId AND pm.status = :status")
    List<ProjectMember> findActiveProjectsByUserId(
        @Param("userId") Long userId,
        @Param("status") MemberStatus status
    );

    // 프로젝트별 역할당 인원수 조회
    @Query("SELECT pm.role, COUNT(pm) FROM ProjectMember pm " +
        "WHERE pm.project.id = :projectId AND pm.status = 'ATTEND' " +
        "GROUP BY pm.role")
    List<Object[]> countRolesByProjectId(@Param("projectId") Long projectId);
}