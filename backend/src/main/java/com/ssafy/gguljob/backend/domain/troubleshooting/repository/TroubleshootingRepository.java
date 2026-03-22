package com.ssafy.gguljob.backend.domain.troubleshooting.repository;

import com.ssafy.gguljob.backend.domain.project.dto.TroubleshootingItem;
import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TroubleshootingRepository extends JpaRepository<Troubleshooting, Long> {

    // 프로젝트 전체 트러블슈팅 개수
    long countByProject_Id(Long projectId);

    // 마이페이지 위젯용: 유저 기준 최신 2개 조회
    List<Troubleshooting> findTop2ByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<Troubleshooting> findByPullRequest_Id(Long prId);

    long countByProject_IdAndUser_Id(Long projectId, Long userId);

    // List 반환 (마이페이지 최근 5개 조회용)
    @Query("SELECT t FROM Troubleshooting t JOIN FETCH t.pullRequest p " +
        "WHERE t.project.id = :projectId AND t.user.id = :userId " +
        "ORDER BY t.createdAt DESC")
    List<Troubleshooting> findMyTsItems(
        @org.springframework.data.repository.query.Param("projectId") Long projectId,
        @org.springframework.data.repository.query.Param("userId") Long userId,
        org.springframework.data.domain.Pageable pageable
    );

    // Page 반환 (전체 목록 페이징 조회용)
    @Query(value = "SELECT t FROM Troubleshooting t JOIN FETCH t.pullRequest p " +
        "WHERE t.project.id = :projectId AND t.user.id = :userId",
        countQuery = "SELECT count(t) FROM Troubleshooting t WHERE t.project.id = :projectId AND t.user.id = :userId")
    org.springframework.data.domain.Page<Troubleshooting> findPagedMyTsItems(
        @org.springframework.data.repository.query.Param("projectId") Long projectId,
        @org.springframework.data.repository.query.Param("userId") Long userId,
        org.springframework.data.domain.Pageable pageable
    );

    @Query("""
    SELECT t FROM Troubleshooting t
    JOIN FETCH t.user u
    JOIN FETCH t.project p
    WHERE t.id IN :ids
    """)
    List<Troubleshooting> findAllByIdIn(@Param("ids") List<Long> ids);
}