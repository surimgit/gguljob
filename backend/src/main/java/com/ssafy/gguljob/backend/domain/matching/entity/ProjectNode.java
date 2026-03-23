package com.ssafy.gguljob.backend.domain.matching.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;
import lombok.Builder;
import lombok.Getter;

import java.util.HashSet;
import java.util.Set;

@Node("Project")
@Getter
@Builder
public class ProjectNode {
    @Id
    private String id;
    private String title;
    private String status;

    // 프로젝트 -> (REQUIRES_SKILL) -> 요구 스킬
    @Relationship(type = "REQUIRES_SKILL", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<SkillNode> skills = new HashSet<>();

    // 프로젝트 -> (REQUIRES_ROLE) -> 모집 직무
    @Relationship(type = "REQUIRES_ROLE", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<RoleNode> roles = new HashSet<>();

    public void updateFrom(ProjectNode newData) {
        this.title = newData.getTitle();
        this.skills = newData.getSkills();
        this.roles = newData.getRoles();
        this.status = newData.getStatus();
    }
}