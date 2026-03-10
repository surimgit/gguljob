package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.project.entity.Project;

public class ProjectResponse {

    public record Id(
        Long projectId
    ) {
        public static Id from(Project project) {
            return new Id(project.getId());
        }
    }
}
