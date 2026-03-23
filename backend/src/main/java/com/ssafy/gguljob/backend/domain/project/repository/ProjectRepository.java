package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import java.util.List;
import org.springframework.data.repository.query.Param;
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

    List<Project> findTop50ByStatusOrderByCreatedAtDesc(ProjectStatus status);

    List<Project> findTop50ByStatusAndIdNotInOrderByCreatedAtDesc(ProjectStatus status, List<Long> joinedProjectIds);

    @Query("SELECT p FROM Project p JOIN FETCH p.leader WHERE p.id IN :projectIds")
    List<Project> findAllWithLeaderByIdIn(@Param("projectIds") List<Long> projectIds);

    @Query("SELECT p.readme FROM Project p WHERE p.leader.id = :leaderId AND p.status = com.ssafy.gguljob.backend.domain.project.type.ProjectStatus.DONE AND p.readme IS NOT NULL AND p.readme <> '' ORDER BY p.createdAt DESC")
    java.util.List<String> findReadmesByLeaderId(@Param("leaderId") Long leaderId);
}