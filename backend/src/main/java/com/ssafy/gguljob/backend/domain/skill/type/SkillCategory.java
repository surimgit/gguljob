package com.ssafy.gguljob.backend.domain.skill.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SkillCategory {
    // Frontend
    JAVASCRIPT("JavaScript"),
    TYPESCRIPT("TypeScript"),
    REACT("React"),
    VUE("Vue.js"),
    NEXTJS("Next.js"),
    HTML_CSS("HTML/CSS"),

    //  Backend
    JAVA("Java"),
    SPRING("Spring"),
    PYTHON("Python"),
    DJANGO("Django"),
    NODEJS("Node.js"),
    C("C"),
    CPP("C++"),
    CSHARP("C#"),
    KOTLIN("Kotlin"),
    RUST("Rust"),
    RUBY("Ruby"),
    GO("Go"),

    //️ Database
    MYSQL("MySQL"),
    POSTGRESQL("PostgreSQL"),
    MONGODB("MongoDB"),
    REDIS("Redis"),

    // DevOps & Infra
    AWS("AWS"),
    DOCKER("Docker"),
    KUBERNETES("Kubernetes"),
    GIT("Git"),

    // AI & Data
    PYTORCH("PyTorch"),
    TENSORFLOW("TensorFlow"),

    // Design & Co-working
    FIGMA("Figma"),
    JIRA("Jira");

    private final String displayName;

    // 프론트에서 "C++" 이라는 글자를 보냈을 때 Enum으로 찰떡같이 바꿔줌
    public static SkillCategory fromDisplayName(String displayName) {
        for (SkillCategory category : SkillCategory.values()) {
            if (category.getDisplayName().equalsIgnoreCase(displayName)) {
                return category;
            }
        }
        throw new IllegalArgumentException("지원하지 않는 기술 스택입니다: " + displayName);
    }
}