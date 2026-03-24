package com.ssafy.gguljob.backend.domain.user.dto;

import com.ssafy.gguljob.backend.domain.user.type.ExperienceLevel;
import com.ssafy.gguljob.backend.domain.user.type.GoalType;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.domain.user.type.TeamTendency;
import com.ssafy.gguljob.backend.domain.user.type.WorkExperienceYear;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OnboardingRequestDto {

    @NotBlank(message = "간단한 자기소개는 필수 입력값입니다.")
    @Size(max = 255, message = "255자를 초과할 수 없습니다.")
    private String description;

    @NotNull(message = "최소 1개 이상의 직무를 선택해주세요.")
    @Size(min = 1, message = "직무는 비어있을 수 없습니다.")
    private List<PositionType> roles;

    @NotNull(message = "개발 경험을 선택해주세요.")
    private ExperienceLevel experience;

    @NotNull(message = "최소 1개 이상의 기술 스택을 선택해주세요.")
    @Size(min = 1, message = "기술 스택은 비어있을 수 없습니다.")
    private List<String> skills;

    @NotBlank(message = "MBTI를 입력해주세요.")
    private String mbti;

    @NotNull(message = "팀 성향을 선택해주세요.")
    private TeamTendency teamTendency;

    private List<GoalType> goals;

    private WorkExperienceYear workExperience;
}