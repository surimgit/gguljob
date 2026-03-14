package com.ssafy.gguljob.backend.domain.join.entity;

import com.ssafy.gguljob.backend.domain.join.type.JoinRequestStatus;
import com.ssafy.gguljob.backend.domain.join.type.JoinRequestType;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.user.entity.User;
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

    @Column(name = "position_id", nullable = false)
    private Long positionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", length = 20, nullable = false)
    private JoinRequestType requestType;

    @Column(name = "appeal_content", columnDefinition = "TEXT")
    private String appealContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JoinRequestStatus status;

    @Builder
    public JoinRequest(User user, Project project, Long positionId, JoinRequestType requestType, String appealContent) {
        this.user = user;
        this.project = project;
        this.positionId = positionId;
        this.requestType = requestType;
        this.appealContent = appealContent;
        this.status = JoinRequestStatus.PENDING;
    }
}