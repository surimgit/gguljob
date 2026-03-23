package com.ssafy.gguljob.backend.domain.project.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {
    FRONTEND("FE 모집중"),
    BACKEND("BE 모집중"),
    DESIGN("디자인 모집중"),
    PM("기획 모집중"),
    IOS("iOS 모집중"),
    ANDROID("Android 모집중");

    private final String description;
}