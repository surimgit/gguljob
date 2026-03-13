package com.ssafy.gguljob.backend.domain.project.entity;

import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_rep_projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserRepProject extends BaseTimeEntity { // 🚀 쌉근본 상속!

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rep_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Builder
    public UserRepProject(User user, Project project) {
        this.user = user;
        this.project = project;
    }
}