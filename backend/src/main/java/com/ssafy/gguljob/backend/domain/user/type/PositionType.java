package com.ssafy.gguljob.backend.domain.user.type;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Getter;

@Getter
public enum PositionType {
    BE("Backend"), FE("Frontend"), AI("AI"), PM("PM"), DEVOPS("DevOps"), DESIGN(
            "Design"), DB("Database"), MOBILE("Mobile"), DATA("Data");

    private final String description;

    PositionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static PositionType from(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        // 소문자도 대문자로 변경 (Frontend -> FRONTEND)
        String upperValue = value.toUpperCase();

        switch (upperValue) {
            case "FRONTEND":
            case "FRONT-END":
            case "FE":
                return FE;
            case "BACKEND":
            case "BACK-END":
            case "BE":
                return BE;
            case "INFRASTRUCTURE":
            case "INFRA":
            case "DEVOPS":
                return DEVOPS;
            case "DATABASE":
            case "DB":
                return DB;
            case "MOBILE":
            case "APP":
            case "IOS":
            case "ANDROID":
                return MOBILE;
            case "DATA":
                return DATA;
            case "TOOLS":
                return PM; // 하위호환: TOOLS 직무 → PM으로 매핑
            case "DESIGN":
                return DESIGN;
            case "PM":
                return PM;
            case "AI":
                return AI;
            default:
                // 매핑 안 된 글자(예: AI, PM)는 그대로 자바 Enum 이름으로 찾기
                try {
                    return PositionType.valueOf(upperValue);
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("올바르지 않은 역할 값입니다: " + value);
                }
        }
    }
}
