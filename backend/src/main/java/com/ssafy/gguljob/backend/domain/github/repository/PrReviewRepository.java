package com.ssafy.gguljob.backend.domain.github.repository;

import com.ssafy.gguljob.backend.domain.github.entity.PrReview;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrReviewRepository extends JpaRepository<PrReview, Long> {
    List<PrReview> findByPullRequest_Id(Long prId);

    void deleteAllByPullRequest_Project_Id(Long projectId);

    /** 특정 프로젝트에서 해당 유저가 받은 리뷰 수 (내 PR에 달린 리뷰) */
    long countByPullRequest_User_IdAndPullRequest_Project_Id(Long userId, Long projectId);

    /** 특정 프로젝트에서 해당 유저가 받은 리뷰 목록 (최신순) */
    List<PrReview> findByPullRequest_User_IdAndPullRequest_Project_IdOrderByIdDesc(
        Long userId, Long projectId, Pageable pageable);
}
