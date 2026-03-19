package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectCardDto;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.exception.OnboardingRequiredException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final ProjectNodeRepository projectNodeRepository;
    private final ProjectService projectService;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true, transactionManager = "neo4jTransactionManager")
    public Page<ProjectResponse.ProjectCardDto> getRecommendedProjects(Long userId, String keyword, String domain, String role, List<Long> skillIds, Pageable pageable) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new OnboardingRequiredException();
        }

        Pageable unsortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        List<String> joinedProjectIds = projectMemberRepository
            .findActiveProjectsByUserId(userId, MemberStatus.ATTEND)
            .stream()
            .map(pm -> String.valueOf(pm.getProject().getId()))
            .toList();

        Page<ProjectMatchResultDto> neo4jResults = projectNodeRepository.findRecommendedProjectsForUser(
            String.valueOf(userId),
            joinedProjectIds,
            keyword,
            domain,
            role,
            skillIds,
            unsortedPageable
        );

        if (neo4jResults.isEmpty()) return Page.empty(pageable);

        List<Long> projectIds = neo4jResults.stream().map(dto -> Long.valueOf(dto.projectId())).toList();
        Map<Long, ProjectResponse.ProjectCardDto> mysqlDataMap = projectService.getProjectCardsMap(projectIds);

        List<ProjectResponse.ProjectCardDto> finalContent = neo4jResults.stream()
            .map(neoDto -> {
                ProjectResponse.ProjectCardDto card = mysqlDataMap.get(Long.valueOf(neoDto.projectId()));
                return (card != null) ? card.withScore(neoDto.score()) : null;
            })
            .filter(Objects::nonNull)
            .toList();

        return new PageImpl<>(finalContent, pageable, neo4jResults.getTotalElements());
    }
}