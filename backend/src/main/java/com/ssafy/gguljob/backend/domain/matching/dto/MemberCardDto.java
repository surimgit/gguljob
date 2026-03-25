package com.ssafy.gguljob.backend.domain.matching.dto;

import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.List;
import java.util.stream.Collectors;

public record MemberCardDto(
    Long userId,
    String userName,
    String profileImageUrl,
    String position,
    String experienceLevel,
    String bio,
    List<String> skills,
    Integer matchScore
) {
    public static MemberCardDto of(User user, Integer matchScore) {

        String pos = (user.getRoles() != null && !user.getRoles().isEmpty())
            ? user.getRoles().stream().map(PositionType::getDescription).collect(Collectors.joining(", "))
            : "미정";
        String level = (user.getExperience() != null) ? user.getExperience().getDescription() : "미정";

        // 유저 스택 추출 (User엔티티 - UserSkill - Skill 구조라고 가정)
        List<String> userSkills = (user.getUserSkills() != null)
            ? user.getUserSkills().stream().map(us -> us.getSkill().getName()).collect(Collectors.toList())
            : java.util.Collections.emptyList();

        return new MemberCardDto(
            user.getId(),
            user.getUserName(),
            user.getProfileImageUrl(),
            pos,
            level,
            user.getDescription(),
            userSkills,
            matchScore
        );
    }
}