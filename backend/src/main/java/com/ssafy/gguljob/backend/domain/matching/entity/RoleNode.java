package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import lombok.Builder;
import lombok.Getter;

@Node("Role")
@Getter
@Builder
public class RoleNode {
    @Id
    private String name; // MySQL의 user_roles.role 값(예: "BE", "FE", "PM")
}