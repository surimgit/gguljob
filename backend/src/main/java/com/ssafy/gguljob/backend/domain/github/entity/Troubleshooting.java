package com.ssafy.project.backend.domain.github.entity;

import com.ssafy.project.backend.domain.project.entity.Project;
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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "troubleshootings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Troubleshooting extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ts_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "pr_id", nullable = false)
    private Long prId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PositionType role;

    @Column(length = 50)
    private String language;

    @Column(length = 100)
    private String framework;

    @Column(columnDefinition = "TEXT")
    private String situation;

    @Column(columnDefinition = "TEXT")
    private String solution;
}