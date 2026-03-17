package com.ssafy.gguljob.backend.domain.user.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GoalType {
    SIDE_PROJECT("사이드 프로젝트"),
    PORTFOLIO("포트폴리오"),
    STUDY("스터디"),
    STARTUP("창업 준비"),
    COMPETITION("공모전"),
    EMPLOYMENT("취업 준비");

    private final String description;
}