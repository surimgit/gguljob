package com.ssafy.gguljob.backend.domain.join.dto;

import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import lombok.Getter;

@Getter
public class InviteUserRequestDto {
    private PositionType role;       // 초대할 역할
    private String appealContent;    //초대 메시지
}