package com.ssafy.gguljob.backend.domain.skill.dto;

import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class SkillResponse {

    public record SkillDto(
        Long id,
        String name,
        String category,
        String iconUrl
    ) {
        public static SkillDto from(Skill skill) {
            return new SkillDto(
                skill.getId(),
                skill.getName(),
                skill.getCategory() != null ? skill.getCategory().name() : null,
                skill.getIconUrl()
            );
        }
    }

    public record SkillListByCategory(
        Map<String, List<SkillDto>> categories
    ) {
        public static SkillListByCategory from(List<Skill> skills) {
            Map<String, List<SkillDto>> grouped = skills.stream()
                .filter(s -> s.getCategory() != null)
                .collect(Collectors.groupingBy(
                    s -> s.getCategory().name(),
                    Collectors.mapping(SkillDto::from, Collectors.toList())
                ));
            return new SkillListByCategory(grouped);
        }
    }
}
