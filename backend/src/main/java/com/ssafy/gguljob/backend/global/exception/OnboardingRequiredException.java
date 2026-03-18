package com.ssafy.gguljob.backend.global.exception;

public class OnboardingRequiredException extends RuntimeException {
    public OnboardingRequiredException() {
        super("온보딩(프로필 설정)이 완료되지 않은 유저입니다.");
    }
}