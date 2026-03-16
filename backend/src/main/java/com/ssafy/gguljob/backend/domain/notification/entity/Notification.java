package com.ssafy.gguljob.backend.domain.notification.entity;

import com.ssafy.gguljob.backend.domain.notification.type.NotificationCategory;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationCategory category;

    @Column(nullable = false, length = 255)
    private String content;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_url", length = 255)
    private String referenceUrl;

    @Column(name = "is_read", nullable = false, columnDefinition = "TINYINT")
    private Boolean isRead = false;

    @Builder
    public Notification(User user, NotificationCategory category, String content, Long referenceId, String referenceUrl) {
        this.user = user;
        this.category = category;
        this.content = content;
        this.referenceId = referenceId;
        this.referenceUrl = referenceUrl;
        this.isRead = false;
    }

    // 읽음 처리용
    public void markAsRead() {
        this.isRead = true;
    }
}
