package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.List;
import java.util.Optional;
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

    // [권한 체크] 특정 유저가 프로젝트 참여 중인지 확인
    boolean existsByProject_IdAndUser_IdAndStatus(Long projetId, Long userId, MemberStatus status);

    // 참여 중인 팀원의 역할 목록 추출
    @Query("SELECT pm.role FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.status = :status")
    List<String> findRolesByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") MemberStatus status);

    // 내가 속한 프로젝트 중 '진행 중'인 것들 중에 생성일 기준 제일 최신인 '1개' 조회
    Optional<ProjectMember> findFirstByUserIdAndProjectStatusOrderByProjectCreatedAtDesc(
        Long userId, ProjectStatus status
    );

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.user.id = :userId AND pm.project.id IN :projectIds")
    List<ProjectMember> findByUserIdAndProjectIdIn(@Param("userId") Long userId, @Param("projectIds") List<Long> projectIds);
}