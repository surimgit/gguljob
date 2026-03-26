package com.ssafy.gguljob.backend.domain.user.controller;

import com.ssafy.gguljob.backend.domain.join.dto.MyApplicationDto;
import com.ssafy.gguljob.backend.domain.join.service.JoinRequestService;
import com.ssafy.gguljob.backend.domain.matching.service.MatchingService;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.troubleshooting.service.TroubleshootingService;
import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingResponse;
import com.ssafy.gguljob.backend.domain.user.dto.OnboardingRequestDto;
import com.ssafy.gguljob.backend.domain.user.dto.PositionResponse;
import com.ssafy.gguljob.backend.domain.user.dto.ProfileResponseDto;
import com.ssafy.gguljob.backend.domain.user.dto.ProfileUpdateRequestDto;
import com.ssafy.gguljob.backend.domain.user.dto.UserResponse;
import com.ssafy.gguljob.backend.domain.user.service.UserService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "유저 프로필 및 온보딩 관련 API")
public class UserController {
    private final UserService userService;
    private final ProjectService projectService;
    private final TroubleshootingService troubleshootingService;
    private final MatchingService matchingService;
    private final JoinRequestService joinRequestService;

    @Operation(summary = "직무 전체 목록 조회")
    @GetMapping("/positions")
    public ResponseEntity<ApiResponseDto<List<PositionResponse.PositionDto>>> getAllPositions() {
        return ResponseEntity.ok(
            new ApiResponseDto<>(200, "직무 목록 조회 성공", PositionResponse.allPositions())
        );
    }

    @Operation(summary = "초기 프로필 설정 (온보딩)", description = "최초 로그인 시 필수 추가 정보를 입력받아 저장합니다.")
    @PostMapping("/onboarding")
    public ResponseEntity<ApiResponseDto<Void>> onboard(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody OnboardingRequestDto requestDto) {

        log.info("온보딩 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        userService.onboardUser(userDetails.getId(), requestDto);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "온보딩 정보 등록 완료", null));
    }

    @Operation(summary = "회원 탈퇴", description = "유저 본인의 계정과 연관된 모든 데이터를 삭제하고 탈퇴합니다.")
    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponseDto<Void>> withdraw(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("회원 탈퇴 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        userService.withdrawUser(userDetails.getId());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "회원 탈퇴가 정상적으로 처리되었습니다.", null));
    }

    @Operation(summary = "내 프로필 정보 조회", description = "로그인한 사용자의 기본 정보 및 기술 스택을 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<ApiResponseDto<ProfileResponseDto>> getMyProfile(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("내 프로필 조회 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        ProfileResponseDto profileDto = userService.getMyProfile(userDetails.getId());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "내 프로필 정보 조회 성공", profileDto));
    }

    @Operation(summary = "내 참여 프로젝트 조회", description = "내가 참여한 프로젝트 목록을 조회합니다.")
    @GetMapping("/me/projects")
    public ResponseEntity<ApiResponseDto<List<ProjectResponse.Simple>>> getMyProjects(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.ok(new ApiResponseDto<>(200, "성공", projectService.getMyProjects(userDetails.getId())));
    }

    @Operation(summary = "마이페이지 표시용 대표 프로젝트 조회")
    @GetMapping("/me/rep_project")
    public ResponseEntity<ApiResponseDto<List<ProjectResponse.Simple>>> getMyRepProjects(
        @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ProjectResponse.Simple> response = projectService.getMyRepProjects(userDetails.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(200, "대표 프로젝트 조회 성공", response));
    }

    @Operation(summary = "마이페이지 위젯용 내 트러블슈팅 조회", description = "마이페이지 하단 위젯에 표시할 트러블슈팅 요약본 2개를 최신순으로 가져옵니다.")
    @GetMapping("/me/troubleshootings/widget")
    public ResponseEntity<ApiResponseDto<List<TroubleshootingResponse.Widget>>> getMyWidget(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getId();

        List<TroubleshootingResponse.Widget> responses = troubleshootingService.getMyWidgetList(userId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "마이페이지 위젯 조회", responses));
    }

    @Operation(summary = "내 프로필 수정", description = "마이페이지에서 내 프로필 정보를 수정합니다.")
    @PatchMapping("/me/profile")
    public ResponseEntity<ApiResponseDto<Void>> updateMyProfile(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody ProfileUpdateRequestDto requestDto) {

        log.info("프로필 수정 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        userService.updateMyProfile(userDetails.getId(), requestDto);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "프로필이 성공적으로 수정되었습니다.", null));
    }

    @Operation(summary = "프로필 이미지 수정", description = "프로필 이미지를 업로드하고 S3 URL을 반환합니다.")
    @PatchMapping(value = "/me/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponseDto<String>> updateProfileImage(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestPart(value = "file") MultipartFile file) {

        log.info("프로필 이미지 업로드 API 호출 - 요청 유저 ID: {}", userDetails.getId());

        String imageUrl = userService.updateProfileImage(userDetails.getId(), file);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "프로필 이미지 업로드 성공", imageUrl));
    }

    @Operation(summary = "내 지원/초대 내역 조회", description = "로그인한 유저의 프로젝트 지원 및 초대 내역을 최신순으로 조회합니다.")
    @GetMapping("/me/applications")
    public ResponseEntity<ApiResponseDto<List<MyApplicationDto>>> getMyApplications(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<MyApplicationDto> applications = joinRequestService.getMyApplications(userDetails.getId());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "지원/초대 내역 조회 성공", applications));
    }

    @Operation(summary = "타 사용자 프로필 조회", description = "사용자 ID를 기반으로 다른 사용자의 공개 프로필을 조회합니다.")
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponseDto<ProfileResponseDto>> getOtherProfile(
        @PathVariable Long userId) {

        log.info("타 사용자 프로필 조회 API 호출 - 대상 유저 ID: {}", userId);

        ProfileResponseDto profileDto = userService.getOtherProfile(userId);

        return ResponseEntity.ok(new ApiResponseDto<>(200, "타 사용자 프로필 조회 성공", profileDto));
    }

//    @Operation(summary = "사용자 전체 목록 조회", description = "페이지네이션을 적용하여 사용자 목록을 조회합니다.")
//    @GetMapping("/users")
//    public ResponseEntity<UserResponse.UserPageResponse> getUsers(
//        @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
//
//        UserResponse.UserPageResponse response = userService.getUsers(pageable);
//        return ResponseEntity.ok(response);
//    }

    @Operation(summary = "팀원(유저) 검색 필터 옵션(메뉴판) 조회", description = "팀원 찾기 페이지의 포지션 및 숙련도 필터 목록(value, label)을 제공합니다.")
    @GetMapping("/filters")
    public ResponseEntity<com.ssafy.gguljob.backend.domain.user.dto.MemberFilterResponseDto> getMemberFilters() {
        return ResponseEntity.ok(userService.getMemberFilters());
    }

    @Operation(summary = "프로필 이미지 초기화 (삭제)", description = "커스텀 프로필 이미지를 삭제하고 기본 상태로 되돌립니다. (다음 로그인 시 깃허브 프사 동기화)")
    @DeleteMapping("/me/profile/image")
    public ResponseEntity<ApiResponseDto<Void>> resetProfileImage(
        @AuthenticationPrincipal CustomUserDetails userDetails) {

        userService.resetProfileImage(userDetails.getId());

        return ResponseEntity.ok(new ApiResponseDto<>(200, "프로필 이미지가 기본으로 초기화되었습니다.", null));
    }
}
