package com.ssafy.gguljob.backend.domain.user.dto;

import com.ssafy.gguljob.backend.domain.user.type.ExperienceLevel;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.domain.user.type.TeamTendency;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OnboardingRequestDto {
    private String description;               // 목표 (User.description 에 매핑)
    private PositionType position;     // 직무 (User.role 에 매핑)
    private ExperienceLevel experience;// 개발 경험
    private List<String> skills;       // 주 언어
    private String mbti;               // MBTI
    private TeamTendency teamTendency; // 팀 내 성향
}