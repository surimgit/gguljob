package com.ssafy.gguljob.backend.domain.troubleshooting.entity;

import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
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
import lombok.AccessLevel;
import lombok.Builder;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pr_id", nullable = false)
    private PullRequest pullRequest;

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

    @Builder
    public Troubleshooting(User user, PullRequest pullRequest, Project project, String title,
        PositionType role, String language, String framework,
        String situation, String solution) {
        this.user = user;
        this.pullRequest = pullRequest;
        this.project = project;
        this.title = title;
        this.role = role;
        this.language = language;
        this.framework = framework;
        this.situation = situation;
        this.solution = solution;
    }

    public void updateContent(String title, PositionType role, String language,
        String framework, String situation, String solution) {
        this.title = title;
        this.role = role;
        this.language = language;
        this.framework = framework;
        this.situation = situation;
        this.solution = solution;
    }

}