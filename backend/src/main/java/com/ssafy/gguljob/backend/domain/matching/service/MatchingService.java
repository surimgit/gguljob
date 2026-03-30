package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.dto.MemberCardDto;
import com.ssafy.gguljob.backend.domain.matching.dto.MemberMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import com.ssafy.gguljob.backend.domain.matching.repository.UserNodeRepository;
import com.ssafy.gguljob.backend.domain.matching.util.MatchingFilterNormalizer;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.service.ProjectService;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.skill.entity.Skill;
import com.ssafy.gguljob.backend.domain.skill.repository.SkillRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.exception.OnboardingRequiredException;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
    private final UserNodeRepository userNodeRepository;
    private final SkillRepository skillRepository;

    @Cacheable(value = "projectRecommend", keyGenerator = "recommendationKeyGenerator")
    @Transactional(readOnly = true)
    public Page<ProjectResponse.ProjectCardDto> getRecommendedProjects(Long userId, String keyword, String domain, String role, List<Long> skillIds, Pageable pageable) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        List<String> normalizedDomains = MatchingFilterNormalizer.normalizeDomainCandidates(domain);
        List<String> normalizedRoles = MatchingFilterNormalizer.normalizeRoleCandidates(role);

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new OnboardingRequiredException();
        }

        List<String> joinedProjectIds = projectMemberRepository
            .findActiveProjectsByUserId(userId, MemberStatus.ATTEND)
            .stream()
            .map(pm -> String.valueOf(pm.getProject().getId()))
            .toList();

        // skillIds → Neo4j Skill 노드의 name으로 변환 (Neo4j Skill 노드에 MySQL id가 없으므로)
        List<String> skillNames = (skillIds != null && !skillIds.isEmpty())
            ? skillRepository.findAllById(skillIds).stream().map(Skill::getName).filter(Objects::nonNull).toList()
            : null;

        // Neo4j 쿼리에서 SKIP/LIMIT 페이지네이션 직접 처리 (전체 로드 제거)
        Page<ProjectMatchResultDto> neo4jResults = projectNodeRepository.findRecommendedProjectsForUser(
            userId,
            joinedProjectIds,
            keyword,
            normalizedDomains,
            normalizedRoles,
            skillNames,
            pageable
        );

        if (neo4jResults.isEmpty()) return Page.empty(pageable);

        List<Long> projectIds = neo4jResults.stream().map(dto -> Long.valueOf(dto.projectId())).toList();
        Map<Long, ProjectResponse.ProjectCardDto> mysqlDataMap = projectService.getProjectCardsMap(projectIds);

        List<ProjectResponse.ProjectCardDto> pageContent = neo4jResults.stream()
            .map(neoDto -> {
                ProjectResponse.ProjectCardDto card = mysqlDataMap.get(Long.valueOf(neoDto.projectId()));
                return (card != null) ? card.withScore(neoDto.score()) : null;
            })
            .filter(Objects::nonNull)
            .toList();

        return new PageImpl<>(pageContent, pageable, neo4jResults.getTotalElements());
    }

    @Cacheable(value = "memberRecommend", keyGenerator = "recommendationKeyGenerator")
    @Transactional(readOnly = true)
    public Page<MemberCardDto> getRecommendedMembers(Long projectId, String keyword, String position, String experienceLevel, Pageable pageable) {

        List<Long> excludedUserIds = projectMemberRepository.findUserIdsByProjectId(projectId);

        // Neo4j 전체 결과 1회 조회 (countQuery 제거 - 페이지네이션은 Java에서 처리)
        List<MemberMatchResultDto> allNeo4jResults = userNodeRepository.findRecommendedMembersForProject(
            String.valueOf(projectId),
            excludedUserIds,
            keyword,
            position,
            experienceLevel
        );

        if (allNeo4jResults.isEmpty()) {
            return Page.empty(pageable);
        }

        // Java 페이지네이션
        int total = allNeo4jResults.size();
        int start = (int) pageable.getOffset();
        if (start >= total) return Page.empty(pageable);
        int end = Math.min(start + pageable.getPageSize(), total);
        List<MemberMatchResultDto> pageSlice = allNeo4jResults.subList(start, end);

        List<Long> userIds = pageSlice.stream().map(dto -> Long.valueOf(dto.userId())).toList();

        // roles FETCH JOIN + userSkills는 @BatchSize(100)로 IN절 배치 로딩 자동 처리
        Map<Long, User> userMap = userRepository.findUsersWithRolesByIds(userIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));

        List<MemberCardDto> finalContent = pageSlice.stream()
            .map(neoDto -> {
                User user = userMap.get(Long.valueOf(neoDto.userId()));
                if (user == null) {
                    log.warn("데이터 불일치 감지: Neo4j에는 존재하나 MySQL에 없는 유저 ID [{}]", neoDto.userId());
                    return null;
                }
                return MemberCardDto.of(user, neoDto.matchScore());
            })
            .filter(java.util.Objects::nonNull)
            .toList();

        return new PageImpl<>(finalContent, pageable, total);
    }
}