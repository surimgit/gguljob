package com.ssafy.gguljob.backend.domain.troubleshooting.repository;

import com.ssafy.gguljob.backend.domain.project.dto.TroubleshootingItem;
import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TroubleshootingRepository extends JpaRepository<Troubleshooting, Long> {

    // 프로젝트 전체 트러블슈팅 개수
    long countByProject_Id(Long projectId);

    // 마이페이지 위젯용
    List<Troubleshooting> findTop2ByProject_IdOrderByCreatedAtDesc(Long projectId);

    Optional<Troubleshooting> findByPullRequest_Id(Long prId);

    long countByProject_IdAndUser_Id(Long projectId, Long userId);

    @Query("SELECT new com.ssafy.gguljob.backend.domain.project.dto.TroubleshootingItem(" +
        "t.id, t.title, t.situation, t.createdAt) " +
        "FROM Troubleshooting t " +
        "WHERE t.project.id = :projectId AND t.user.id = :userId " +
        "ORDER BY t.createdAt DESC")
    List<TroubleshootingItem> findMyTsItems(
        @org.springframework.data.repository.query.Param("projectId") Long projectId,
        @org.springframework.data.repository.query.Param("userId") Long userId,
        org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT new com.ssafy.gguljob.backend.domain.project.dto.TroubleshootingItem(" +
        "t.id, t.title, t.situation, t.createdAt) " +
        "FROM Troubleshooting t " +
        "WHERE t.project.id = :projectId AND t.user.id = :userId " +
        "ORDER BY t.createdAt DESC")
    org.springframework.data.domain.Page<com.ssafy.gguljob.backend.domain.project.dto.TroubleshootingItem> findPagedMyTsItems(
        @org.springframework.data.repository.query.Param("projectId") Long projectId,
        @org.springframework.data.repository.query.Param("userId") Long userId,
        org.springframework.data.domain.Pageable pageable
    );
}