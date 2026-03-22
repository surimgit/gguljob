package com.ssafy.gguljob.backend.domain.project.repository;

import com.ssafy.gguljob.backend.domain.project.entity.UserRepProject;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepProjectRepository extends JpaRepository<UserRepProject, Long> {

    @Query("SELECT u FROM UserRepProject u JOIN FETCH u.project WHERE u.user.id = :userId ORDER BY u.id ASC")
    List<UserRepProject> findByUserIdWithProject(@Param("userId") Long userId);

    void deleteAllByUserId(Long userId);
}
