package com.ssafy.gguljob.backend.domain.job.repository;

import com.ssafy.gguljob.backend.domain.job.entity.JobBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobBookmarkRepository extends JpaRepository<JobBookmark, Long> {
    Optional<JobBookmark> findByUserIdAndJobPostingId(Long userId, Long postingId);

    // 내 북마크 목록 조회(페이지네이션 및 N + 1 방지)
    @Query(value = "SELECT jb FROM JobBookmark jb JOIN FETCH jb.jobPosting WHERE jb.user.id = :userId ORDER BY jb.createdAt DESC",
        countQuery = "SELECT count(jb) FROM JobBookmark jb WHERE jb.user.id = :userId")
    Page<JobBookmark> findByUserIdWithJobPosting(@Param("userId") Long userId, Pageable pageable);
}