package com.ssafy.gguljob.backend.domain.project.controller;

import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.Simple;
import com.ssafy.gguljob.backend.domain.project.service.ProjectDashboardService;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects")
@Tag(name = "Project", description = "프로젝트 API")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectDashboardService dashboardService;

    @PostMapping
    public ResponseEntity<ProjectResponse.Id> createProject(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody ProjectRequest.Create request){

        ProjectResponse.Id response = projectService.createProject(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<Simple>> getMyProjects(
        @AuthenticationPrincipal CustomUserDetails userDetails){

        List<ProjectResponse.Simple> response = projectService.getMyProjects(userDetails.getId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{projectId}/team-dashboard")
    public ResponseEntity<ProjectResponse.TeamDashboard> getTeamDashboard(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId){

        Long userId = (userDetails != null) ? userDetails.getId() : null;

        return ResponseEntity.ok(dashboardService.getTeamDashboard(userId, projectId));
    }

    @GetMapping("/{projectId}/gitlog")
    public ResponseEntity<ProjectResponse.GitLog> getGitLog(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId){

        Long userId = (userDetails != null) ? userDetails.getId() : null;

        return ResponseEntity.ok(dashboardService.getGitLog(userId, projectId));
    }
}