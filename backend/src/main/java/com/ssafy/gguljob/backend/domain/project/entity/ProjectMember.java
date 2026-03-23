package com.ssafy.gguljob.backend.domain.project.entity;

import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectMember extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private ProjectPosition projectPosition;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MemberStatus status = MemberStatus.ATTEND;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PositionType role;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    public ProjectMember(Project project, User user, ProjectPosition projectPosition, MemberStatus status, PositionType role){
        this.project = project;
        this.user = user;
        this.status = status == null ? MemberStatus.ATTEND : status;
        this.role = role;
        this.projectPosition = projectPosition;
    }

    public void leaveProject() {
        this.status = MemberStatus.LEAVE;
        this.deletedAt = LocalDateTime.now();
    }

    public void revokeProject() {
        this.status = MemberStatus.REVOKE;
        this.deletedAt = LocalDateTime.now();
    }
}