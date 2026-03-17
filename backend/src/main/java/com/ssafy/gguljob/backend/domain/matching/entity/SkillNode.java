package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import lombok.Builder;
import lombok.Getter;

@Node("Skill")
@Getter
@Builder
public class SkillNode {
    @Id
    private String id;
    private String name; // 예: "Java", "Spring Boot"
}