package com.ssafy.gguljob.backend.domain.project.controller;

import com.ssafy.gguljob.backend.domain.project.dto.ProjectMemberResponse;
import com.ssafy.gguljob.backend.domain.project.service.ProjectMemberService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects/{projectId}")
@Tag(name = "Project Member", description = "프로젝트의 팀원 관련 API")
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    @Operation(summary = "본인 팀 나가기", description = "자발적으로 팀 나가는 API (팀장일 경우 젤 오래된 사람이 팀장 위임)")
    @DeleteMapping("/leave/me")
    public ResponseEntity<ProjectMemberResponse.ProjectLeaveResponse> leaveProject(
        @PathVariable("projectId") Long projectId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectMemberResponse.ProjectLeaveResponse response = projectMemberService.leaveProject(projectId, userDetails.getId());
        return ResponseEntity.ok(response);
    }
}
