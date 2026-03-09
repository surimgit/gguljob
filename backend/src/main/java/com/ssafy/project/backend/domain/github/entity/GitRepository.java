package com.ssafy.project.backend.domain.github.entity;

import com.ssafy.project.backend.domain.project.entity.Project;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "git_repositories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GitRepository {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "repo_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "repo_url", nullable = false, length = 255)
    private String repoUrl;

    @Column(name = "webhook_secret", nullable = false, length = 100)
    private String webhookSecret;
}