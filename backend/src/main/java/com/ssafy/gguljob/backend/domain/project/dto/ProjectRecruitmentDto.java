package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.project.type.PositionStatus;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.List;

public class ProjectRecruitmentDto {

    // 공고 생성 요청
    public record CreateRequest(
        PositionType role,
        Integer targetCount,
        List<String> requireSkills
    ) {}

    // 모집 공고 생성 응답
    public record CreateResponse(
        Long positionId,
        PositionType role,
        Integer targetCount,
        String message
    ) {}

    // 상태 수정 요청
    public record UpdateStatusRequest(
        PositionStatus status
    ) {}

    // 모집 인원 수정 요청
    public record UpdateCountRequest(
        Integer targetCount
    ) {}

    // 공통 수정 응답
    public record UpdateResponse(
        Long positionId,
        PositionStatus status,
        Integer targetCount,
        String message
    ) {}
}
