package com.ssafy.gguljob.backend.domain.project.dto;

public class ProjectMemberResponse {

    // 본인 나가기 응답
    public record ProjectLeaveResponse(
        Long projectId,
        Long leftUserId,
        Long newLeaderId, // 리더가 변경된 경우에만 ID 반환, 아니면 null
        String message
    ) { }

    // 팀원 내보내기 응답
    public record ProjectKickResponse(
        Long projectId,
        Long kickedUserId,
        String message
    ) {}

}
