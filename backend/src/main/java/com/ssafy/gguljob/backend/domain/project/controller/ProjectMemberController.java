package com.ssafy.gguljob.backend.domain.project.controller;

import com.ssafy.gguljob.backend.domain.project.dto.ProjectMemberResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRecruitmentDto;
import com.ssafy.gguljob.backend.domain.project.service.ProjectMemberService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects/{projectId}")
@Tag(name = "Project Member", description = "프로젝트의 팀원 관련 API")
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    @Operation(summary = "본인 팀 나가기", description = "자발적으로 팀 나가는 API (팀장일 경우 젤 오래된 사람이 팀장 위임)")
    @DeleteMapping("/members/leave")
    public ResponseEntity<ProjectMemberResponse.ProjectLeaveResponse> leaveProject(
        @PathVariable("projectId") Long projectId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectMemberResponse.ProjectLeaveResponse response = projectMemberService.leaveProject(projectId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "팀원 내보내기", description = "팀장이 특정 팀원을 강제로 내보내는 API")
    @DeleteMapping("/members/{targetUserId}")
    public ResponseEntity<ProjectMemberResponse.ProjectKickResponse> kickMember(
        @PathVariable("projectId") Long projectId,
        @PathVariable("targetUserId") Long targetUserId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectMemberResponse.ProjectKickResponse response =
            projectMemberService.kickMember(projectId, userDetails.getId(), targetUserId);

        return ResponseEntity.ok(response);
    }

    // 팀원 모집 공고 올리기
    @Operation(summary = "팀원 모집 공고 생성", description = "팀장이 새로운 직무의 팀원 모집 공고를 올립니다.")
    @PostMapping("/recruitments")
    public ResponseEntity<ProjectRecruitmentDto.CreateResponse> createRecruitment(
        @PathVariable("projectId") Long projectId,
        @RequestBody ProjectRecruitmentDto.CreateRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectRecruitmentDto.CreateResponse response =
            projectMemberService.createRecruitment(projectId, userDetails.getId(), request);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "모집 상태 수정", description = "공고의 상태를 진행(RECRUITING) 또는 마감(DONE)으로 변경합니다.")
    @PatchMapping("/recruitments/{positionId}/status")
    public ResponseEntity<ProjectRecruitmentDto.UpdateResponse> updateStatus(
        @PathVariable("projectId") Long projectId,
        @PathVariable("positionId") Long positionId,
        @RequestBody ProjectRecruitmentDto.UpdateStatusRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectRecruitmentDto.UpdateResponse response =
            projectMemberService.updateStatus(projectId, positionId, userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "모집 인원 조정", description = "공고의 목표 모집 인원을 수정합니다.")
    @PatchMapping("/recruitments/{positionId}/target-count")
    public ResponseEntity<ProjectRecruitmentDto.UpdateResponse> updateTargetCount(
        @PathVariable("projectId") Long projectId,
        @PathVariable("positionId") Long positionId,
        @RequestBody ProjectRecruitmentDto.UpdateCountRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectRecruitmentDto.UpdateResponse response =
            projectMemberService.updateTargetCount(projectId, positionId, userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "팀장 위임", description = "현재 팀장이 특정 팀원에게 팀장 권한을 위임하는 API")
    @PatchMapping("/members/{targetUserId}/delegate")
    public ResponseEntity<ProjectMemberResponse.DelegateResponse> delegateLeader(
        @PathVariable("projectId") Long projectId,
        @PathVariable("targetUserId") Long targetUserId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProjectMemberResponse.DelegateResponse response =
            projectMemberService.delegateLeader(projectId, userDetails.getId(), targetUserId);

        return ResponseEntity.ok(response);
    }

}
