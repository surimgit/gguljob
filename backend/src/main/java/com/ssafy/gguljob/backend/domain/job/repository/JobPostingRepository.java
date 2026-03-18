package com.ssafy.gguljob.backend.domain.job.repository;

import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByIdIn(List<Long> ids);
}
