package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import lombok.Builder;
import lombok.Getter;

@Node("MBTI")
@Getter
@Builder
public class MbtiNode {
    @Id
    private String type; // 예: "INTJ", "ENFP"
}