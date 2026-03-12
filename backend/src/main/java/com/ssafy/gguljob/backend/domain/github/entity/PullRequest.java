package com.ssafy.gguljob.backend.domain.github.entity;

import com.ssafy.gguljob.backend.domain.github.type.PrStatus;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pull_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PullRequest extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pr_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id", nullable = false)
    private GitRepository gitRepository;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "pr_number")
    private Integer prNumber;

    @Column(length = 200)
    private String title;

    @Column(name = "diff_url", length = 255)
    private String diffUrl;

    @Column(name = "diff_content", columnDefinition = "MEDIUMTEXT")
    private String diffContent;

    @Column(name = "diff_summary", columnDefinition = "TEXT")
    private String diffSummary;

    @Column(name = "branch_name", nullable = false, length = 100)
    private String branchName;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private PrStatus status;

    @Column(name = "github_created_at")
    private LocalDateTime githubCreatedAt;

    @Builder
    public PullRequest(GitRepository gitRepository, User user, Project project,
        Integer prNumber, String title, String branchName,
        PrStatus status, LocalDateTime githubCreatedAt) {
        this.gitRepository = gitRepository;
        this.user = user;
        this.project = project;
        this.prNumber = prNumber;
        this.title = title;
        this.branchName = branchName;
        this.status = status;
        this.githubCreatedAt = githubCreatedAt;
    }
}