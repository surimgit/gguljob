package com.ssafy.gguljob.backend.domain.join.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class JoinSubmitRequestDto {
    @NotNull(message = "포지션 ID는 필수입니다.")
    private Long positionId;

    private String requestType;
    private String appealContent;
}