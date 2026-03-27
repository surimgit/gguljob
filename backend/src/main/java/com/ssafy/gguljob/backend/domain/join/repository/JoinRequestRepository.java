package com.ssafy.gguljob.backend.domain.join.repository;

import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    // 이미 지원한 프로젝트인지 검증 (PENDING 상태만 확인 — 거절/취소 후 재지원/재초대 허용)
    boolean existsByProjectIdAndUserIdAndStatus(Long projectId, Long userId, com.ssafy.gguljob.backend.domain.join.type.JoinRequestStatus status);

    // 특정 프로젝트의 '대기 중(PENDING)'인 참가 신청 목록만 최신순으로 조회
    @Query("SELECT j FROM JoinRequest j " +
        "JOIN FETCH j.user u " +
        "LEFT JOIN FETCH u.userSkills us " +
        "LEFT JOIN FETCH us.skill " +
        "WHERE j.project.id = :projectId AND j.status = 'PENDING' " +
        "ORDER BY j.createdAt DESC")
    List<JoinRequest> findPendingRequestsByProjectId(@Param("projectId") Long projectId);

    // 특정 유저의 지원/초대 내역을 최신순으로 조회
    @Query("SELECT j FROM JoinRequest j " +
        "JOIN FETCH j.project p " +
        "WHERE j.user.id = :userId " +
        "ORDER BY j.createdAt DESC")
    List<JoinRequest> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    void deleteAllByProjectId(Long projectId);
}