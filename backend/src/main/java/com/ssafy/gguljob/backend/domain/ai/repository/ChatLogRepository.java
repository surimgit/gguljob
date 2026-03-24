package com.ssafy.gguljob.backend.domain.ai.repository;

import com.ssafy.gguljob.backend.domain.ai.entity.ChatLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {

    List<ChatLog> findByPullRequest_Id(Long prId);

    List<ChatLog> findByProject_IdAndCreatedAtBetween(
        Long projectId,
        LocalDateTime start,
        LocalDateTime end
    );

    void deleteAllByProject_Id(Long projectId);
}