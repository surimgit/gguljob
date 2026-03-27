package com.ssafy.gguljob.backend.domain.project.entity;

import com.ssafy.gguljob.backend.domain.project.type.PositionStatus;
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
@Table(name = "project_positions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectPosition extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "position_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PositionType role;

    @Column(length = 255)
    private String description;

    @Column(name = "target_count", nullable = false)
    private Integer targetCount = 1;

    @Column(name = "current_count", nullable = false)
    private Integer currentCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PositionStatus status = PositionStatus.RECRUITING;

    @Column(name = "require_skills", length = 255)
    private String requireSkills;

    @Column(name = "requirement", length = 255)
    private String requirement;

    @Builder
    public ProjectPosition(Project project, PositionType role, Integer targetCount, String requireSkills, String description, String requirement) {
        this.project = project;
        this.role = role;
        this.targetCount = targetCount;
        this.requireSkills = requireSkills;
        this.description = description;
        this.requirement = requirement;
    }

    // 현재 인원 변경
    public void changeCurrentCount(Integer currentCount) {
        this.currentCount = currentCount;
    }

    // 상태 변경
    public void changeStatus(PositionStatus status) {
        this.status = status;
    }

    // 목표 인원 변경
    public void changeTargetCount(Integer targetCount) {
        this.targetCount = targetCount;
    }
}