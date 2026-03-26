package com.ssafy.gguljob.backend.domain.join.dto;

import com.ssafy.gguljob.backend.domain.join.entity.JoinRequest;
import com.ssafy.gguljob.backend.domain.join.type.JoinRequestStatus;
import com.ssafy.gguljob.backend.domain.join.type.JoinRequestType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyApplicationDto {
    private Long requestId;
    private Long projectId;
    private String projectTitle;
    private String positionName;
    private JoinRequestStatus status;
    private JoinRequestType requestType;
    private LocalDateTime createdAt;

    public static MyApplicationDto of(JoinRequest request, String positionName) {
        return MyApplicationDto.builder()
            .requestId(request.getId())
            .projectId(request.getProject().getId())
            .projectTitle(request.getProject().getTitle())
            .positionName(positionName)
            .status(request.getStatus())
            .requestType(request.getRequestType())
            .createdAt(request.getCreatedAt())
            .build();
    }
}
