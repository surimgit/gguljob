package com.ssafy.gguljob.backend.domain.join.repository;

import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    // 이미 지원한 프로젝트인지 검증
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
}