package com.ssafy.gguljob.backend.domain.project.entity;

import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import com.ssafy.gguljob.backend.domain.skill.entity.ProjectSkill;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    @Column(name = "team_name", length = 50)
    private String teamName;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 50)
    private String domain;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProjectStatus status = ProjectStatus.RECRUITING;

    @Column(name = "is_public", nullable = false, columnDefinition = "TINYINT")
    private Boolean isPublic = false;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String readme;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @OneToMany(mappedBy = "project")
    private List<ProjectSkill> projectSkills = new ArrayList<>();

    @Builder
    public Project(User leader, String teamName, String title, String domain, String description, Boolean isPublic, String imageUrl, String readme) {
        this.leader = leader;
        this.teamName = teamName;
        this.title = title;
        this.domain = domain;
        this.description = description;
        this.status = ProjectStatus.RECRUITING;
        this.isPublic = isPublic != null ? isPublic : false;
        this.imageUrl = imageUrl;
        this.readme = readme;
    }

    public void updateBasicInfo(String title, String teamName, String description, String domain, String status) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (teamName != null && !teamName.isBlank()) {
            this.teamName = teamName;
        }
        if (status != null && !status.isBlank()) {
            this.status = ProjectStatus.valueOf(status);
        }
        if (description != null) {
            this.description = description;
        }
        if (domain != null) {
            this.domain = domain;
        }
    }

    public void updateReadme(String readme) {
        this.readme = readme;
    }
}