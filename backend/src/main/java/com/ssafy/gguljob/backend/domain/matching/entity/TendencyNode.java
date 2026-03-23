package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import lombok.Builder;
import lombok.Getter;

@Node("Tendency")
@Getter
@Builder
public class TendencyNode {
    @Id
    private String type; // MySQL의 team_tendency(예: "리더", "팔로워")
}