package com.ssafy.gguljob.backend.domain.skill.controller;

import com.ssafy.gguljob.backend.domain.skill.dto.SkillResponse;
import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import com.ssafy.gguljob.backend.domain.skill.service.SkillService;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Skill", description = "기술 스택 API")
@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @Operation(summary = "기술 스택 전체 목록 조회 (카테고리별 그룹)")
    @GetMapping
    public ResponseEntity<ApiResponseDto<SkillResponse.SkillListByCategory>> getAllSkills() {
        List<Skill> skills = skillService.getAllSkills();
        return ResponseEntity.ok(
            new ApiResponseDto<>(200, "기술 스택 목록 조회 성공", SkillResponse.SkillListByCategory.from(skills))
        );
    }
}
