package com.ssafy.gguljob.backend.domain.project.controller;

import com.ssafy.gguljob.backend.domain.project.dto.PersonalSpaceResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectUpdateResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.Simple;
import com.ssafy.gguljob.backend.domain.project.dto.TeamManagementResponseDto;
import com.ssafy.gguljob.backend.domain.project.service.ProjectDashboardService;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @Operation(summary = "프로젝트 수정 기본 폼", description = "내 프로젝트 정보를 수정 화면에 띄워줍니다")
    @GetMapping("/{projectId}/edit")
    public ResponseEntity<ProjectResponse.UpdateFormInfo> getProjectForEdit(
        @PathVariable Long projectId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ProjectResponse.UpdateFormInfo response = projectService.getUpdateForm(projectId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectUpdateResponse> updateProject(
        @PathVariable Long projectId,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody @Valid ProjectRequest.ProjectUpdateRequest request
    ) {
        ProjectUpdateResponse response = projectService.updateProject(projectId, request, userDetails.getId());
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

    @PutMapping("/{projectId}/git-repo")
    public ResponseEntity<Void> registerGitRepository(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @Valid @RequestBody ProjectRequest.RegisterGitRepo request) {

        projectService.registerGitRepository(userDetails.getId(), projectId, request);

        return ResponseEntity.ok().build();
    }

    // 팀원 관리 (모집 현황, 현재 팀원, 참가 신청 현황)
    @Operation(summary = "팀원 관리 페이지 상세 조회", description = "프로젝트 리더가 팀원 관리 페이지의 모든 정보(모집, 멤버, 신청)를 조회합니다.")
    @GetMapping("/{projectId}/members/detail")
    public ResponseEntity<ApiResponseDto<TeamManagementResponseDto>> getTeamManagementDetail(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId) {

        TeamManagementResponseDto response = projectService.getTeamManagementDetail(userDetails.getId(), projectId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "팀원 관리 페이지 조회가 완료되었습니다.", response));
    }

    @Operation(summary = "프로젝트 개인 페이지", description = "내 PR/MR과 트러블슈팅 조회")
    @GetMapping("/{projectId}/personal-space")
    public ResponseEntity<PersonalSpaceResponse.Dashboard> getProjectForEdit(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId) {

        PersonalSpaceResponse.Dashboard response = dashboardService.getPersonalSpace(projectId, userDetails.getId());
        return ResponseEntity.ok(response);
    }
}