package com.ssafy.gguljob.backend.domain.user.dto;

import com.ssafy.gguljob.backend.domain.user.type.ExperienceLevel;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.domain.user.type.TeamTendency;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProfileUpdateRequestDto {
    @Size(max = 255, message = "255자를 초과할 수 없습니다.")
    private String description;

    @NotNull(message = "최소 1개 이상의 직무를 선택해주세요.")
    @Size(min = 1, message = "직무는 비어있을 수 없습니다.")
    private List<PositionType> roles;

    private String mbti;

    private TeamTendency teamTendency;

    private ExperienceLevel experience;

    private List<String> skills;
}
