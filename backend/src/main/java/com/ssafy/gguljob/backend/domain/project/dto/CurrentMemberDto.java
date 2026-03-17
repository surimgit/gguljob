package com.ssafy.gguljob.backend.domain.project.dto;

import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CurrentMemberDto {
    private Long memberId;
    private Long userId;
    private PositionType role;
    private String userName;
    private String profileImageUrl;
    private LocalDateTime joinedAt;

    public static CurrentMemberDto from(ProjectMember member) {
        return CurrentMemberDto.builder()
            .memberId(member.getId())
            .userId(member.getUser().getId())
            .role(member.getRole())
            .userName(member.getUser().getUserName())
            .profileImageUrl(member.getUser().getProfileImageUrl())
            .joinedAt(member.getCreatedAt())
            .build();
    }
}