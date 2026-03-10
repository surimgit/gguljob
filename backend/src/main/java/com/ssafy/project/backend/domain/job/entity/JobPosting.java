package com.ssafy.project.backend.domain.job.entity;

import com.ssafy.project.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "job_posting")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class JobPosting extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "posting_id")
    private Long id;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(nullable = false, length = 200)
    private String title;

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
}