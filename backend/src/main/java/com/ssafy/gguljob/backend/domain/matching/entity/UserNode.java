package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;
import lombok.Builder;
import lombok.Getter;

import java.util.HashSet;
import java.util.Set;

@Node("User")
@Getter
@Builder
public class UserNode {

    @Id
    private Long id; // MySQL의 users.user_id

    private String userName; // MySQL의 user_name

    // 유저 -> (HAS_SKILL) -> 스킬
    @Relationship(type = "HAS_SKILL", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<SkillNode> skills = new HashSet<>();

    // 유저 -> (WANTS_ROLE) -> 직무
    @Relationship(type = "WANTS_ROLE", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<RoleNode> roles = new HashSet<>();

    // 유저 -> (HAS_MBTI) -> MBTI
    @Relationship(type = "HAS_MBTI", direction = Relationship.Direction.OUTGOING)
    private MbtiNode mbti;

    // 유저 -> (HAS_TENDENCY) -> 팀 성향
    @Relationship(type = "HAS_TENDENCY", direction = Relationship.Direction.OUTGOING)
    private TendencyNode tendency;

    // 유저 -> (HAS_EXPERIENCE) -> 경험
    @Relationship(type = "HAS_EXPERIENCE", direction = Relationship.Direction.OUTGOING)
    private ExperienceNode experience;

    // 유저 -> (PURSUES_GOAL) -> 목표
    @Relationship(type = "PURSUES_GOAL", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<GoalNode> goals = new HashSet<>();
}