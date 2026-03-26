package com.ssafy.gguljob.backend.domain.matching.util;

import com.ssafy.gguljob.backend.domain.project.type.Domain;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class MatchingFilterNormalizer {

    private MatchingFilterNormalizer() {
    }

    public static String toNeo4jRoleName(PositionType positionType) {
        if (positionType == null) {
            return null;
        }
        return switch (positionType) {
            case FE -> "FRONTEND";
            case BE -> "BACKEND";
            default -> positionType.name();
        };
    }

    public static List<String> normalizeDomainCandidates(String domain) {
        if (domain == null || domain.isBlank()) {
            return null;
        }

        String trimmed = domain.trim();
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(trimmed);

        for (Domain value : Domain.values()) {
            if (value.name().equalsIgnoreCase(trimmed) || value.getDescription().equalsIgnoreCase(trimmed)) {
                candidates.add(value.name());
                candidates.add(value.getDescription());
                break;
            }
        }

        return new ArrayList<>(candidates);
    }

    public static List<String> normalizeRoleCandidates(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }

        String trimmed = role.trim();
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(trimmed);

        if (trimmed.endsWith(" 모집중")) {
            candidates.add(trimmed.substring(0, trimmed.length() - 4));
        }

        String positionRaw = trimmed.endsWith(" 모집중") ? trimmed.substring(0, trimmed.length() - 4) : trimmed;
        try {
            PositionType positionType = PositionType.from(positionRaw);
            candidates.add(positionType.name());
            candidates.add(positionType.getDescription());
            candidates.add(positionType.getDescription() + " 모집중");
            candidates.add(toNeo4jRoleName(positionType));

            if (positionType == PositionType.MOBILE) {
                candidates.add("ANDROID");
                candidates.add("IOS");
                candidates.add("Android 모집중");
                candidates.add("iOS 모집중");
            }
            if (positionType == PositionType.DEVOPS) {
                candidates.add("INFRA");
                candidates.add("Infra");
                candidates.add("Infra 모집중");
            }
        } catch (IllegalArgumentException ignored) {
        }

        if ("FE".equalsIgnoreCase(trimmed) || "FE 모집중".equalsIgnoreCase(trimmed)) {
            candidates.add("FRONTEND");
            candidates.add("FE 모집중");
        }
        if ("BE".equalsIgnoreCase(trimmed) || "BE 모집중".equalsIgnoreCase(trimmed)) {
            candidates.add("BACKEND");
            candidates.add("BE 모집중");
        }
        if ("디자인 모집중".equals(trimmed)) {
            candidates.add("DESIGN");
        }
        if ("기획 모집중".equals(trimmed)) {
            candidates.add("PM");
        }

        return List.copyOf(candidates);
    }
}
