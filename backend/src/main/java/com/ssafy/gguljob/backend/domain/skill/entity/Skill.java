package com.ssafy.gguljob.backend.domain.skill.entity;

import com.ssafy.gguljob.backend.domain.skill.type.SkillCategory;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "skill")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Skill extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "skill_id")
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 255)
    private String synonyms;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private SkillCategory category;

    @Column(name = "icon_url", length = 255)
    private String iconUrl;
}