package com.ssafy.gguljob.backend.domain.job.entity;

import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;

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
@Table(name = "job_posting_skill")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobPostingSkill extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "job_posting_skill_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "posting_id", nullable = false)
  private JobPosting jobPosting;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "skill_id", nullable = false)
  private Skill skill;

  public JobPostingSkill(JobPosting jobPosting, Skill skill) {
    this.jobPosting = jobPosting;
    this.skill = skill;
  }
}
