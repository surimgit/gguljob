package com.ssafy.gguljob.backend.domain.job.entity;

import java.time.LocalDateTime;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "job_posting")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class JobPosting extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "posting_id")
    private Long id;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "experience_level", length = 100)
    private String experienceLevel;

    @Column(length = 100)
    private String salary;

    @Column(length = 200)
    private String hyperlink;

    @Column(name = "position_details", columnDefinition = "TEXT")
    private String positionDetails;

    @Column(name = "main_tasks", columnDefinition = "TEXT")
    private String mainTasks;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "preferred_points", columnDefinition = "TEXT")
    private String preferredPoints;

    private LocalDateTime deadline;

    @Column(name = "origin_job_id", length = 100)
    private String originJobId;

    @Column(name = "job_category", length = 255)
    private String jobCategory;

    @Column(name = "tech_stacks", columnDefinition = "TEXT")
    private String techStacks;

    @Column(length = 255)
    private String location;

    @Column(name = "contract_type", length = 50)
    private String contractType;

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

}
