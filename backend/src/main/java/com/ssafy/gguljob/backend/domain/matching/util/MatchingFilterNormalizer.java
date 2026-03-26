package com.ssafy.gguljob.backend.domain.matching.util;

import com.ssafy.gguljob.backend.domain.project.type.Domain;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
        addRoleInputAliases(trimmed, candidates);

        String positionRaw = toPositionRaw(trimmed);
        try {
            PositionType positionType = PositionType.from(positionRaw);
            addPositionTypeAliases(positionType, candidates);
        } catch (IllegalArgumentException e) {
            log.warn("Unrecognized position type raw string: {}", positionRaw);
        }

        return List.copyOf(candidates);
    }

    private static String toPositionRaw(String role) {
        if (role.endsWith(" 모집중")) {
            return role.substring(0, role.length() - 4);
        }
        return role;
    }

    private static void addRoleInputAliases(String role, Set<String> candidates) {
        candidates.add(role);

        if (role.endsWith(" 모집중")) {
            candidates.add(toPositionRaw(role));
        }

        if ("FE".equalsIgnoreCase(role) || "FE 모집중".equalsIgnoreCase(role)) {
            candidates.add("FRONTEND");
            candidates.add("FE 모집중");
        }
        if ("BE".equalsIgnoreCase(role) || "BE 모집중".equalsIgnoreCase(role)) {
            candidates.add("BACKEND");
            candidates.add("BE 모집중");
        }
    }

    private static void addPositionTypeAliases(PositionType positionType, Set<String> candidates) {
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
    }
}
