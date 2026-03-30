package com.ssafy.gguljob.backend.domain.job.repository;

import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByIdIn(List<Long> ids);

    @Query("""
            SELECT j FROM JobPosting j
            WHERE j.id IN :ids AND j.experienceLevel IN :levels
            """)
    List<JobPosting> findByIdInAndExperienceLevelIn(@Param("ids") List<Long> ids, @Param("levels") List<String> levels);

    @Query("""
            SELECT j
            FROM JobPosting j
            WHERE j.id IN :ids
            ORDER BY
              CASE WHEN j.deadline IS NULL THEN 1 ELSE 0 END,
              j.deadline ASC,
              j.id ASC
            """)
    List<JobPosting> findByIdInOrderByDeadline(@Param("ids") List<Long> ids);

    @Query("""
            SELECT j FROM JobPosting j
            WHERE j.id IN :ids AND j.experienceLevel IN :levels
            ORDER BY
              CASE WHEN j.deadline IS NULL THEN 1 ELSE 0 END,
              j.deadline ASC,
              j.id ASC
            """)
    List<JobPosting> findByIdInAndExperienceLevelInOrderByDeadline(@Param("ids") List<Long> ids, @Param("levels") List<String> levels);
}
