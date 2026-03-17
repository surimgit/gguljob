package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import lombok.Builder;
import lombok.Getter;

@Node("Experience")
@Getter
@Builder
public class ExperienceNode {
    @Id
    private String level; // 예: "입문", "초급", "중급", "고급"
}