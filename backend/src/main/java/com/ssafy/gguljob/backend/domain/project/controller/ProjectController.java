package com.ssafy.gguljob.backend.domain.project.controller;

import com.ssafy.gguljob.backend.domain.matching.dto.MemberCardDto;
import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.service.MatchingService;
import com.ssafy.gguljob.backend.domain.project.dto.PersonalSpaceResponse;
import com.ssafy.gguljob.backend.domain.project.dto.PrItem;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectCardDto;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectUpdateResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.Simple;
import com.ssafy.gguljob.backend.domain.project.dto.TeamManagementResponseDto;
import com.ssafy.gguljob.backend.domain.project.dto.TroubleshootingItem;
import com.ssafy.gguljob.backend.domain.project.service.ProjectDashboardService;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects")
@Tag(name = "Project", description = "프로젝트 API")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectDashboardService dashboardService;
    private final MatchingService matchingService;

    @Operation(summary = "프로젝트 생성 API", description = "새로운 프로젝트를 생성합니다")
    @PostMapping
    public ResponseEntity<ProjectResponse.Id> createProject(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody ProjectRequest.Create request){

        ProjectResponse.Id response = projectService.createProject(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "프로젝트 네비바 클릭 시 뜨는 내 프로젝트들", description = "진행중/완료 프로젝트 리스트 조회")
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

    @Operation(summary = "프로젝트 수정 API", description = "프로젝트 기본 정보 수정")
    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectUpdateResponse> updateProject(
        @PathVariable Long projectId,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody @Valid ProjectRequest.ProjectUpdateRequest request
    ) {
        ProjectUpdateResponse response = projectService.updateProject(projectId, request, userDetails.getId());
        return ResponseEntity.ok(response);
    }


    @Operation(summary = "프로젝트 상세 페이지(팀프로젝트 탭)", description = "프로젝트 기본 정보 가져오기")
    @GetMapping("/{projectId}/team-dashboard")
    public ResponseEntity<ProjectResponse.TeamDashboard> getTeamDashboard(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId){

        Long userId = (userDetails != null) ? userDetails.getId() : null;

        return ResponseEntity.ok(dashboardService.getTeamDashboard(userId, projectId));
    }

    @Operation(summary = "팀프로젝트 상세 페이지(git 관련 랭킹, 최근 내역)", description = "git 관련 랭킹, 최근 내역)")
    @GetMapping("/{projectId}/gitlog")
    public ResponseEntity<ProjectResponse.GitLog> getGitLog(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId){

        Long userId = (userDetails != null) ? userDetails.getId() : null;

        return ResponseEntity.ok(dashboardService.getGitLog(userId, projectId));
    }

    @Operation(summary = "팀프로젝트 상세 페이지 (깃 레포 등록하기)", description = "깃 레포 등록하기")
    @PutMapping("/{projectId}/git-repo")
    public ResponseEntity<ProjectResponse.GitRepoRegistered> registerGitRepository(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @Valid @RequestBody ProjectRequest.RegisterGitRepo request) {

        ProjectResponse.GitRepoRegistered response =
            projectService.registerGitRepository(userDetails.getId(), projectId, request);

        return ResponseEntity.ok(response);
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

    @Operation(summary = "프로젝트 상세 개인 페이지(나만의 공간 탭)", description = "내 PR/MR과 트러블슈팅 조회")
    @GetMapping("/{projectId}/personal-space")
    public ResponseEntity<PersonalSpaceResponse.Dashboard> getProjectForEdit(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId) {

        PersonalSpaceResponse.Dashboard response = dashboardService.getPersonalSpace(projectId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "나만의 공간 탭 (내 PR 목록조회)", description = "해당 프로젝트의 내 PR 목록 전체 조회")
    @GetMapping("/{projectId}/personal-space/pull-requests")
    public ResponseEntity<Page<PrItem>> getMyPullRequests(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @ParameterObject @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<PrItem> response = dashboardService.getPagedMyPullRequests(projectId, userDetails.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 트러블슈팅 목록조회(프로젝트 상세 개인 페이지)", description = "해당 프로젝트의 내 트러블슈팅 목록 전체 조회")
    @GetMapping("/{projectId}/personal-space/troubleshootings")
    public ResponseEntity<Page<TroubleshootingItem>> getMyTroubleshootings(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId,
        @ParameterObject @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<TroubleshootingItem> response = dashboardService.getPagedMyTroubleshootings(projectId, userDetails.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "프로젝트 검색 필터 옵션 조회", description = "프로젝트 검색 시 필요한 기술스택, 도메인, 포지션 필터 목록을 제공합니다. 실제 필터링된 검색 결과는 /list API에 파라미터를 넘겨서 조회하세요")
    @GetMapping("/filters")
    public ResponseEntity<?> getProjectFilters() {
        return ResponseEntity.ok(projectService.getProjectFilters());
    }

    @Operation(summary = "메인 상단 표시 프로젝트 조회", description = "프로젝트 찾기 페이지 상단에 노출되는 프로젝트 목록을 최신순으로 조회합니다.")
    @GetMapping("/recommended/top")
    public ResponseEntity<List<ProjectResponse.ProjectCardDto>> getTopProjects(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = (userDetails != null) ? userDetails.getId() : null;
        return ResponseEntity.ok(projectService.getTopProjects(userId));
    }

    @Operation(summary = "프로젝트 목록 조회 (추천순)", description = "현재 모집 중인 프로젝트를 조회합니다.<br>" +
        "- 검색어(제목), 도메인, 포지션, 기술스택 필터를 URL 파라미터로 넘기면 해당 조건에 맞게 필터링됩니다.<br>" +
        "- 필터 조건에 맞는 프로젝트 중, 사용자와의 매칭 스코어가 높은 순(추천순)으로 정렬되어 반환됩니다.")
    @GetMapping("/list")
    public ResponseEntity<Page<ProjectCardDto>> getProjectList(
        @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,

        @Parameter(description = "검색어 (제목 기준)", example = "감자")
        @RequestParam(required = false) String keyword,
        @Parameter(description = "도메인 필터", example = "IT")
        @RequestParam(required = false) String domain,
        @Parameter(description = "포지션(직무) 필터", example = "BACKEND")
        @RequestParam(required = false) String role,
        @Parameter(description = "기술 스택 ID 리스트", example = "1,2,3")
        @RequestParam(required = false) List<Long> skillIds,

        @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
        @RequestParam(defaultValue = "0") int page,

        @Parameter(description = "한 페이지당 데이터 개수", example = "10")
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        Long userId = (userDetails != null) ? userDetails.getId() : null;

        Page<ProjectCardDto> result = matchingService.getRecommendedProjects(userId, keyword, domain, role, skillIds, pageable);

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "AI 추천 주제 적용", description = "AI가 추천한 주제 중 하나를 선택하여 프로젝트의 주제(topic)로 설정합니다.")
    @PatchMapping("/{projectId}/topic")
    public ResponseEntity<Void> applyRecommendedTopic(
        @PathVariable Long projectId,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody @Valid ProjectRequest.ApplyTopicRequest request
    ) {
        projectService.applyRecommendedTopic(projectId, userDetails.getId(), request.selectedTopic());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "추천 팀원 목록 및 검색", description = "필터(포지션, 숙련도) 및 키워드(이름, 포지션명)를 기반으로 팀원을 추천순으로 페이징 조회합니다.")
    @GetMapping("/{projectId}/recommended-members")
    public ResponseEntity<org.springframework.data.domain.Page<com.ssafy.gguljob.backend.domain.matching.dto.MemberCardDto>> getRecommendedMembersList(
        @PathVariable Long projectId,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String position,
        @RequestParam(required = false) String experienceLevel,
        @org.springframework.data.web.PageableDefault(size = 10) org.springframework.data.domain.Pageable pageable
    ) {
        return ResponseEntity.ok(matchingService.getRecommendedMembers(projectId, keyword, position, experienceLevel, pageable));
    }

    @Operation(summary = "상단 표시 추천 팀원 Top 3 조회", description = "프로젝트 요건에 가장 잘 맞는 팀원 상위 3명을 조회합니다.")
    @GetMapping("/{projectId}/recommended-members/top")
    public ResponseEntity<List<MemberCardDto>> getTop3RecommendedMembers(
        @PathVariable Long projectId
    ) {
        org.springframework.data.domain.Page<MemberCardDto> result =
            matchingService.getRecommendedMembers(
                projectId,
                null, null, null,
                org.springframework.data.domain.PageRequest.of(0, 3)
            );

        return ResponseEntity.ok(result.getContent());
    }

    @Operation(summary = "프로젝트 삭제", description = "프로젝트를 삭제합니다. 팀장만 가능합니다.")
    @DeleteMapping("/{projectId}")
    public ResponseEntity<ApiResponseDto<Void>> deleteProject(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long projectId) {

        projectService.deleteProject(projectId, userDetails.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(200, "프로젝트가 삭제되었습니다.", null));
    }
}