package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import lombok.Builder;
import lombok.Getter;

@Node("Goal")
@Getter
@Builder
public class GoalNode {
    @Id
    private String name; // MySQL의 user_goals.goal 값(예: "사이드 프로젝트", "취업 준비")
}