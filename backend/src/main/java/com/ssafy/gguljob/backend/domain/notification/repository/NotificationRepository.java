package com.ssafy.gguljob.backend.domain.notification.repository;

import com.ssafy.gguljob.backend.domain.notification.entity.Notification;
import com.ssafy.gguljob.backend.domain.notification.type.ActionStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 정렬: PENDING 최우선 → 안 읽은 것 → 최신순
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId " +
           "ORDER BY CASE WHEN n.actionStatus = 'PENDING' THEN 0 ELSE 1 END ASC, " +
           "n.isRead ASC, n.createdAt DESC")
    Page<Notification> findAllByUserIdOrdered(@Param("userId") Long userId, Pageable pageable);

    // referenceId로 PENDING 알림 조회 (수락/거절 시 상태 업데이트용)
    List<Notification> findByReferenceIdAndActionStatus(Long referenceId, ActionStatus actionStatus);

    // 전체 읽음 처리(안 읽은 것만 처리)
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    // 내 알림 전체 삭제
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteAllByUserId(Long userId);

    // 안 읽은 알림 개수
    Long countByUserIdAndIsReadFalse(Long userId);
}