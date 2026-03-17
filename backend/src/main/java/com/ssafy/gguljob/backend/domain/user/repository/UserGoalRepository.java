package com.ssafy.gguljob.backend.domain.user.repository;

import com.ssafy.gguljob.backend.domain.user.entity.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {
    // 특정 유저의 목표 삭제(수정용)
    void deleteAllByUserId(Long userId);

    // 유저 목표 조회용
    List<UserGoal> findAllByUserId(Long userId);
}