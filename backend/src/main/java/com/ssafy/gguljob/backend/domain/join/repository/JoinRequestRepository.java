package com.ssafy.gguljob.backend.domain.join.repository;

import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    // 이미 지원한 프로젝트인지 검증
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    // 특정 프로젝트의 '대기 중(PENDING)'인 참가 신청 목록만 최신순으로 조회
    @Query("SELECT j FROM JoinRequest j JOIN FETCH j.user " +
        "WHERE j.project.id = :projectId AND j.status = 'PENDING' " +
        "ORDER BY j.createdAt DESC")
    List<JoinRequest> findPendingRequestsByProjectId(@Param("projectId") Long projectId);

    void deleteAllByProjectId(Long projectId);
}