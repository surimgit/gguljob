package com.ssafy.gguljob.backend.domain.join.entity;

import com.ssafy.gguljob.backend.domain.join.type.JoinRequestStatus;
import com.ssafy.gguljob.backend.domain.join.type.JoinRequestType;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "join_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JoinRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "position_id")
    private Long positionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 50)
    private PositionType role;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", length = 20, nullable = false)
    private JoinRequestType requestType;

    @Column(name = "appeal_content", columnDefinition = "TEXT")
    private String appealContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JoinRequestStatus status;

    @Builder
    public JoinRequest(User user, Project project, Long positionId, JoinRequestType requestType,PositionType role, String appealContent) {
        this.user = user;
        this.project = project;
        this.positionId = positionId;
        this.role = role;
        this.requestType = requestType;
        this.appealContent = appealContent;
        this.status = JoinRequestStatus.PENDING;
    }

    public void accept() {
        if (this.status != JoinRequestStatus.PENDING) {
            throw new IllegalStateException("대기 중인 요청만 수락할 수 있습니다.");
        }
        this.status = JoinRequestStatus.ACCEPTED;
    }

    public void reject() {
        if (this.status != JoinRequestStatus.PENDING) {
            throw new IllegalStateException("대기 중인 요청만 거절할 수 있습니다.");
        }
        this.status = JoinRequestStatus.REJECTED;
    }
}