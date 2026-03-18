package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.entity.*;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository; // 프로젝트 레포지토리 맞게 임포트!
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectPositionRepository projectPositionRepository;
    private final Neo4jGraphService neo4jGraphService;

    @Transactional(readOnly = true)
    public void syncProjectToGraph(Long projectId) {
        log.info("Neo4j 그래프 DB 조립 시작: 프로젝트 ID = {}", projectId);

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("동기화할 프로젝트를 찾을 수 없습니다."));

        var skillNodes = project.getProjectSkills().stream()
            .map(ps -> SkillNode.builder().id(String.valueOf(ps.getSkill().getId())).name(ps.getSkill().getName()).build())
            .collect(Collectors.toSet());

        var roleNodes = projectPositionRepository.findAllByProjectId(projectId).stream()
            .map(pos -> RoleNode.builder().name(pos.getRole().name()).build())
            .collect(Collectors.toSet());

        ProjectNode projectNode = ProjectNode.builder()
            .id(String.valueOf(project.getId()))
            .title(project.getTitle())
            .skills(skillNodes)
            .roles(roleNodes)
            .build();

        neo4jGraphService.saveProjectNode(projectNode, projectId);
    }
}