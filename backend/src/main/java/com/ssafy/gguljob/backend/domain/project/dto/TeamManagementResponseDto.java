package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.join.dto.PendingJoinRequestDto;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class TeamManagementResponseDto {
    // 요청자가 프로젝트 리더인지 여부
    private boolean isLeader;

    // 1. 팀원 모집 현황 리스트
    private List<RecruitmentStatusDto> recruitments;

    // 2. 현재 팀원 리스트
    private List<CurrentMemberDto> currentMembers;

    // 3. 참가 신청 현황
    private List<PendingJoinRequestDto> pendingRequests;
}