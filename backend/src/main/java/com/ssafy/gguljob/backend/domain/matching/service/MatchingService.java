package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.dto.MemberCardDto;
import com.ssafy.gguljob.backend.domain.matching.dto.MemberMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import com.ssafy.gguljob.backend.domain.matching.repository.UserNodeRepository;
import com.ssafy.gguljob.backend.domain.matching.util.MatchingFilterNormalizer;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse.ProjectCardDto;
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
    private final UserNodeRepository userNodeRepository;
    private final SkillRepository skillRepository;

    @Cacheable(value = "projectRecommend", key = "#userId + '_' + #keyword + '_' + #domain + '_' + #role + '_' + #skillIds + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    @Transactional(readOnly = true, transactionManager = "neo4jTransactionManager")
    public Page<ProjectResponse.ProjectCardDto> getRecommendedProjects(Long userId, String keyword, String domain, String role, List<Long> skillIds, Pageable pageable) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        List<String> normalizedDomains = MatchingFilterNormalizer.normalizeDomainCandidates(domain);
        List<String> normalizedRoles = MatchingFilterNormalizer.normalizeRoleCandidates(role);

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new OnboardingRequiredException();
        }

        // Neo4j에서 충분한 후보를 조회한 뒤 MySQL 필터링 → 수동 페이지네이션
        Pageable allPageable = PageRequest.of(0, 10000);

        List<String> joinedProjectIds = projectMemberRepository
            .findActiveProjectsByUserId(userId, MemberStatus.ATTEND)
            .stream()
            .map(pm -> String.valueOf(pm.getProject().getId()))
            .toList();

        // skillIds → Neo4j Skill 노드의 name으로 변환 (Neo4j Skill 노드에 MySQL id가 없으므로)
        List<String> skillNames = (skillIds != null && !skillIds.isEmpty())
            ? skillRepository.findAllById(skillIds).stream().map(Skill::getName).filter(Objects::nonNull).toList()
            : null;

        Page<ProjectMatchResultDto> neo4jResults = projectNodeRepository.findRecommendedProjectsForUser(
            userId,
            joinedProjectIds,
            keyword,
            normalizedDomains,
            normalizedRoles,
            skillNames,
            allPageable
        );

        if (neo4jResults.isEmpty()) return Page.empty(pageable);

        List<Long> projectIds = neo4jResults.stream().map(dto -> Long.valueOf(dto.projectId())).toList();
        Map<Long, ProjectResponse.ProjectCardDto> mysqlDataMap = projectService.getProjectCardsMap(projectIds);

        List<ProjectResponse.ProjectCardDto> allFiltered = neo4jResults.stream()
            .map(neoDto -> {
                ProjectResponse.ProjectCardDto card = mysqlDataMap.get(Long.valueOf(neoDto.projectId()));
                return (card != null) ? card.withScore(neoDto.score()) : null;
            })
            .filter(Objects::nonNull)
            .filter(card -> card.status() == com.ssafy.gguljob.backend.domain.project.type.ProjectStatus.RECRUITING)
            .filter(card -> card.positions().stream()
                .anyMatch(pos -> pos.currentCount() < pos.targetCount()))
            .toList();

        // 수동 페이지네이션
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allFiltered.size());
        List<ProjectResponse.ProjectCardDto> pageContent = start >= allFiltered.size()
            ? List.of()
            : allFiltered.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allFiltered.size());
    }

    @Cacheable(value = "memberRecommend", key = "#projectId + '_' + #keyword + '_' + #position + '_' + #experienceLevel + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    @Transactional(readOnly = true, transactionManager = "neo4jTransactionManager")
    public Page<MemberCardDto> getRecommendedMembers(Long projectId, String keyword, String position, String experienceLevel, Pageable pageable) {

        Pageable unsortedPageable = pageable.isPaged()
            ? PageRequest.of(pageable.getPageNumber(), pageable.getPageSize())
            : PageRequest.of(0, 10);
        // 제외할 유저
        List<Long> excludedUserIds = projectMemberRepository.findUserIdsByProjectId(projectId)
            .stream()
            .map(Long::valueOf)
            .toList();

        // Neo4j 쿼리
        Page<MemberMatchResultDto> neo4jResults = userNodeRepository.findRecommendedMembersForProject(
            String.valueOf(projectId),
            excludedUserIds,
            keyword,
            position,
            experienceLevel,
            unsortedPageable
        );

        if (neo4jResults.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Long> userIds = neo4jResults.stream().map(dto -> Long.valueOf(dto.userId())).toList();

        Map<Long, User> userMap = userRepository.findUsersWithRolesByIds(userIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));

        // 유저 정보 + 적합도 점수
        List<MemberCardDto> finalContent = neo4jResults.stream()
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

        return new PageImpl<>(finalContent, pageable, neo4jResults.getTotalElements());
    }
}