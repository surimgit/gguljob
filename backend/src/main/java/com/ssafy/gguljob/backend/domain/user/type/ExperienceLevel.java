package com.ssafy.gguljob.backend.domain.user.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;

@Getter
@RequiredArgsConstructor
public enum ExperienceLevel {
    BEGINNER("초급"), JUNIOR("중급(주니어)"), MID_LEVEL("중급(미들)"), SENIOR("고급");

    private final String description;

    public String getDescription() {
        return description;
    }
}
