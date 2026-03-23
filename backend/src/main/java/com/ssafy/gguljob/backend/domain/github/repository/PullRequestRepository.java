package com.ssafy.gguljob.backend.domain.github.repository;

import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.project.dto.PrItem;
import java.util.Optional;
import org.springframework.data.repository.query.Param;
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
    @Query("SELECT pr.user.id as userId, pr.user.userName as userName, pr.user.profileImageUrl as profileImageUrl, COUNT(pr.id) as mrCount " +
        "FROM PullRequest pr WHERE pr.project.id = :projectId " +
        "GROUP BY pr.user.id ORDER BY COUNT(pr.id) DESC")
    List<MrRankingProjection> findMrRankingByProjectId(@Param("projectId") Long projectId, Pageable pageable);

    List<PullRequest> findByGitRepository_Id(Long gitRepositoryId);

    public interface MrRankingProjection {
        Long getUserId();
        String getUserName();
        String getProfileImageUrl();
        Long getMrCount();
    }

    Optional<PullRequest> findByGitRepository_IdAndPrNumber(Long repoId, Integer prNumber);

    long countByProject_IdAndUser_Id(Long projectId, Long userId);

    @Query("SELECT new com.ssafy.gguljob.backend.domain.project.dto.PrItem(" +
        "p.id, p.prNumber, p.title, p.status, p.githubCreatedAt, p.githubClosedAt) " +
        "FROM PullRequest p " +
        "WHERE p.project.id = :projectId AND p.user.id = :userId " +
        "ORDER BY COALESCE(p.githubClosedAt, p.githubCreatedAt) DESC")
    List<PrItem> findMyPrItems(
        @org.springframework.data.repository.query.Param("projectId") Long projectId,
        @org.springframework.data.repository.query.Param("userId") Long userId,
        org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT new com.ssafy.gguljob.backend.domain.project.dto.PrItem(" +
        "p.id, p.prNumber, p.title, p.status, p.githubCreatedAt, p.githubClosedAt) " +
        "FROM PullRequest p " +
        "WHERE p.project.id = :projectId AND p.user.id = :userId " +
        "ORDER BY COALESCE(p.githubClosedAt, p.githubCreatedAt) DESC")
    org.springframework.data.domain.Page<com.ssafy.gguljob.backend.domain.project.dto.PrItem> findPagedMyPrItems(
        @org.springframework.data.repository.query.Param("projectId") Long projectId,
        @org.springframework.data.repository.query.Param("userId") Long userId,
        org.springframework.data.domain.Pageable pageable
    );

    void deleteAllByProjectId(Long projectId);
}
