package com.ssafy.gguljob.backend.domain.user.service;

import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.entity.UserRepProject;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.repository.UserRepProjectRepository;
import com.ssafy.gguljob.backend.domain.skill.repository.UserSkillRepository;
import com.ssafy.gguljob.backend.domain.user.dto.OnboardingRequestDto;
import com.ssafy.gguljob.backend.domain.user.dto.ProfileResponseDto;
import com.ssafy.gguljob.backend.domain.user.dto.ProfileUpdateRequestDto;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.infra.s3.S3ImageService;
import com.ssafy.gguljob.backend.global.redis.RedisService;
import jakarta.persistence.EntityNotFoundException;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ssafy.gguljob.backend.domain.skill.service.SkillService;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final SkillService skillService;

    private final UserSkillRepository userSkillRepository;
    private final RedisService redisService;
    private final ProjectMemberRepository projectMemberRepository;
    private final S3ImageService s3ImageService;
    private final UserRepProjectRepository userRepProjectRepository;
    private final ProjectSkillRepository projectSkillRepository;

    public void onboardUser(Long userId, OnboardingRequestDto requestDto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("유저를 찾을 수 없습니다."));

        user.updateOnboarding(
            requestDto.getDescription(),
            requestDto.getRoles(),
            requestDto.getExperience(),
            requestDto.getMbti(),
            requestDto.getTeamTendency()
        );

        skillService.saveUserSkills(user, requestDto.getSkills());

        log.info("유저(ID:{}) 온보딩 기본 정보 업데이트 완료", userId);
    }

    public void updateMyProfile(Long userId, ProfileUpdateRequestDto requestDto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("유저를 찾을 수 없습니다."));

        user.updateProfile(requestDto);

        if(requestDto.getSkills() != null) {
            skillService.saveUserSkills(user, requestDto.getSkills());
        }
    }

    public void withdrawUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("이미 탈퇴했거나 없는 유저입니다."));

        userSkillRepository.deleteAllByUser(user);

        userRepository.delete(user);

        redisService.deleteValues("RT:" + userId);

        log.info("유저(ID:{}) 회원 탈퇴 및 데이터 영구 삭제 완료", userId);
    }

    @Transactional(readOnly = true)
    public ProfileResponseDto getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("유저 정보를 찾을 수 없습니다."));

        List<ProfileResponseDto.SkillDto> skillDtoList = userSkillRepository.findAllByUser(user).stream()
            .map(userSkill -> ProfileResponseDto.SkillDto.builder()
                .name(userSkill.getSkill().getName())
                .category(userSkill.getSkill().getCategory().name())
                .iconUrl(userSkill.getSkill().getIconUrl())
                .build())
            .toList();

        return ProfileResponseDto.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .userName(user.getUserName())
            .imageUrl(user.getImageUrl())
            .description(user.getDescription())
            .roles(user.getRoles() != null ? user.getRoles().stream().map(Enum::name).toList() : Collections.emptyList())
            .experience(user.getExperience() != null ? user.getExperience().name() : null)
            .mbti(user.getMbti())
            .teamTendency(user.getTeamTendency() != null ? user.getTeamTendency().name() : null)
            .skills(skillDtoList)
            .build();
    }

    @Transactional
    public String updateProfileImage(Long userId, MultipartFile file) {
        // 1. 유저 찾기
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        // 2. S3에 이미지 업로드하고 URL 받아오기
        String uploadedImageUrl = s3ImageService.uploadProfileImage(file);

        // 3. 유저 엔티티에 URL 업데이트
        user.updateImageUrl(uploadedImageUrl);

        // 4. 업로드된 URL 반환 (프론트엔드에서 바로 화면에 띄울 수 있게)
        return uploadedImageUrl;
    }

    @Transactional(readOnly = true)
    public ProfileResponseDto getOtherProfile(Long targetUserId) {

        User user = userRepository.findById(targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 2. 타 유저 기술 스택 목록
        List<ProfileResponseDto.SkillDto> skillDtoList = userSkillRepository.findAllByUser(user).stream()
            .map(userSkill -> ProfileResponseDto.SkillDto.builder()
                .name(userSkill.getSkill().getName())
                .category(userSkill.getSkill().getCategory().name())
                .iconUrl(userSkill.getSkill().getIconUrl())
                .build())
            .toList();

        // 3. '대표 프로젝트' 긁어와서 조립
        List<UserRepProject> repProjectEntities = userRepProjectRepository.findByUserId(targetUserId);

        List<ProfileResponseDto.RepProjectDto> repProjectDtoList = repProjectEntities.stream()
            .map(rep -> {
                Project project = rep.getProject();

                // 프로젝트에서 이 유저의 역할(Role) 찾기
                String roleName = projectMemberRepository.findByProjectIdAndUserId(project.getId(), targetUserId)
                    .map(member -> member.getRole().name()) // "프론트엔드 리드" 같은 문자열이 나온다고 가정
                    .orElse("참여자"); // 못 찾았을 때 기본값

                // 기간 포맷팅 (예: "2024.09 ~ 2024.12")
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy.MM");
                String startStr = project.getCreatedAt() != null ? project.getCreatedAt().format(formatter) : "미상";
                String endStr = project.getFinishedAt() != null ? project.getFinishedAt().format(formatter) : "진행중";
                String period = startStr + " - " + endStr;

                // 프로젝트에 쓰인 기술 스택 이름들만 List<String>으로 긁어오기
                List<String> projectSkills = projectSkillRepository.findByProjectId(project.getId()).stream()
                    .map(ps -> ps.getSkill().getName())
                    .toList();

                return ProfileResponseDto.RepProjectDto.builder()
                    .projectId(project.getId())
                    .title(project.getTitle())
                    .description(project.getDescription())
                    .role(roleName)
                    .period(period)
                    .skills(projectSkills)
                    .build();
            })
            .limit(2)
            .toList();

        return ProfileResponseDto.builder()
            .userId(user.getId())
            .userName(user.getUserName())
            .imageUrl(user.getImageUrl())
            .description(user.getDescription())
            .roles(user.getRoles() != null
                ? user.getRoles().stream().map(Enum::name).toList()
                : java.util.Collections.emptyList())
            .skills(skillDtoList)
            .repProjects(repProjectDtoList)
            .build();
    }
}
