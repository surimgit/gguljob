package com.ssafy.gguljob.backend.domain.job.repository;

import com.ssafy.gguljob.backend.domain.job.entity.JobBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface JobBookmarkRepository extends JpaRepository<JobBookmark, Long> {
    Optional<JobBookmark> findByUserIdAndJobPostingId(Long userId, Long postingId);
}