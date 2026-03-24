package com.ssafy.gguljob.backend.domain.user.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WorkExperienceYear {
    NEWCOMER("신입"),          // 신입, 신입·경력 공고에 매칭
    ONE_TO_THREE("1~3년"),    // 경력 1~3년 이상 공고에 매칭
    FOUR_TO_SIX("4~6년"),     // 경력 4~6년 이상 공고에 매칭
    MORE_THAN_SEVEN("7년 이상"); // 경력 7년 이상 공고에 매칭

    private final String description;
}
