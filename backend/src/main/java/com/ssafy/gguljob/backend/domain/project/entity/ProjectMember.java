package com.ssafy.project.backend.domain.project.entity;

import com.ssafy.project.backend.domain.project.type.MemberStatus;
import com.ssafy.project.backend.domain.user.entity.User;
import com.ssafy.project.backend.domain.user.type.PositionType;
import com.ssafy.project.backend.global.entity.BaseTimeEntity;
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

    @Column(name = "position_id")
    private Long positionId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MemberStatus status = MemberStatus.ATTEND;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PositionType role;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}