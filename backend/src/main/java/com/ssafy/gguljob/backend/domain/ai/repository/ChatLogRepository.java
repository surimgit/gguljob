package com.ssafy.gguljob.backend.domain.ai.repository;

import com.ssafy.gguljob.backend.domain.ai.entity.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {
}