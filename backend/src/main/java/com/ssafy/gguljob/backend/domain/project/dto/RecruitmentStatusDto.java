package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;
import com.ssafy.gguljob.backend.domain.project.type.PositionStatus;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import lombok.Builder;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class RecruitmentStatusDto {
    private Long positionId;
    private PositionType role;
    private PositionStatus status;
    private Integer currentCount;
    private Integer targetCount;

    public static RecruitmentStatusDto from(ProjectPosition position) {

        return RecruitmentStatusDto.builder()
            .positionId(position.getId())
            .role(position.getRole())
            .status(position.getStatus())
            .currentCount(position.getCurrentCount())
            .targetCount(position.getTargetCount())
            .build();
    }

    public static RecruitmentStatusDto of(ProjectPosition position, List<String> skillNames) {
        return RecruitmentStatusDto.builder()
            .positionId(position.getId())
            .role(position.getRole())
            .status(position.getStatus())
            .currentCount(position.getCurrentCount())
            .targetCount(position.getTargetCount())
            .build();
    }
}