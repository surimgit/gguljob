package com.ssafy.gguljob.backend.domain.github.repository;

import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PullRequestRepository extends JpaRepository<PullRequest, Long> {

    // 프로젝트 전체 PR 개수
    long countByProject_Id(Long projectId);

    // 최근 PR 5개 조회
    List<PullRequest> findTop5ByProject_IdOrderByCreatedAtDesc(Long projectId);

    // MR 가장 많이 올린 사람 조회
    @Query("SELECT pr.user.id as userId, pr.user.userName as userName, pr.user.imageUrl as profileImageUrl, COUNT(pr.id) as mrCount " +
        "FROM PullRequest pr WHERE pr.project.id = :projectId " +
        "GROUP BY pr.user.id ORDER BY COUNT(pr.id) DESC")
    List<MrRankingProjection> findMrRankingByProjectId(@Param("projectId") Long projectId, Pageable pageable);

    public interface MrRankingProjection {
        Long getUserId();
        String getUserName();
        String getProfileImageUrl();
        Long getMrCount();
    }
}
