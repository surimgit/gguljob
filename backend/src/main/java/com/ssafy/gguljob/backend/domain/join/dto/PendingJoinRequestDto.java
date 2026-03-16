package com.ssafy.gguljob.backend.domain.join.dto;

import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PendingJoinRequestDto {
    private Long requestId;         // 수락/거절 버튼용 ID
    private Long userId;            // 유저 프로필 이동용 ID
    private String userName;        // 유저 이름
    private String userProfileImageUrl;
    private String positionName;    // "Backend" (지원한 직무)
    private List<String> techStacks; // ["Spring Boot", "JPA", "Docker"]
    private LocalDateTime createdAt; // "10분 전" 계산용 시간

    public static PendingJoinRequestDto of(JoinRequest request, String positionName, List<String> techStacks) {
        return PendingJoinRequestDto.builder()
            .requestId(request.getId())
            .userId(request.getUser().getId())
            .userName(request.getUser().getUserName())
            .userProfileImageUrl(request.getUser().getProfileImageUrl())
            .positionName(positionName)
            .techStacks(techStacks)
            .createdAt(request.getCreatedAt())
            .build();
    }
}