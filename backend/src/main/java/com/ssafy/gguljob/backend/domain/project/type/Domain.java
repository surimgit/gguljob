package com.ssafy.gguljob.backend.domain.project.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Domain {
    WEB_TECH("웹기술"),
    WEB_DESIGN("웹디자인"),
    MOBILE("모바일"),
    AIOT("AIoT"),
    AI("인공지능"),
    BIG_DATA("빅데이터"),
    BLOCKCHAIN("블록체인"),
    AUTONOMOUS_DRIVING("자율주행"),
    FINTECH("핀테크"),
    METAVERSE("메타버스");

    private final String description;
}