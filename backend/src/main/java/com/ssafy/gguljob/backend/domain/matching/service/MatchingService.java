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
import java.util.Comparator;
import java.util.HashMap;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.core.Neo4jClient;
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
    private final Neo4jClient neo4jClient;

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

        // Neo4j: graphScore만 반환 (벡터 dot product는 Java에서 계산)
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

        // 프로젝트 임베딩 1회 조회
        List<Double> projectEmbedding = fetchEmbedding("Project", "id", String.valueOf(projectId));

        // 유저 임베딩 배치 조회 (프로젝트 임베딩 없으면 생략)
        Map<Long, List<Double>> userEmbeddings = new HashMap<>();
        if (projectEmbedding != null) {
            List<Long> allUserIds = allNeo4jResults.stream()
                .map(dto -> Long.valueOf(dto.userId()))
                .toList();
            neo4jClient.query("MATCH (u:User) WHERE u.id IN $ids RETURN u.id AS userId, u.embedding AS embedding")
                .bind(allUserIds).to("ids")
                .fetch().all()
                .forEach(row -> {
                    Object emb = row.get("embedding");
                    if (emb instanceof List<?> embList) {
                        userEmbeddings.put((Long) row.get("userId"), (List<Double>) embList);
                    }
                });
        }

        // Java에서 최종 matchScore 계산 후 재정렬
        List<MemberMatchResultDto> scored = allNeo4jResults.stream()
            .map(dto -> {
                double vectorScore = 0.0;
                if (projectEmbedding != null) {
                    List<Double> userEmb = userEmbeddings.get(Long.valueOf(dto.userId()));
                    if (userEmb != null) {
                        vectorScore = dotProduct(userEmb, projectEmbedding) * 100;
                    }
                }
                int matchScore = (int) (dto.graphScore() * 0.6 + vectorScore * 0.4);
                return new MemberMatchResultDto(dto.userId(), matchScore);
            })
            .sorted(Comparator.comparingInt(MemberMatchResultDto::graphScore).reversed()
                .thenComparing(Comparator.comparingLong((MemberMatchResultDto d) -> Long.parseLong(d.userId())).reversed()))
            .toList();

        // Java 페이지네이션
        int total = scored.size();
        int start = (int) pageable.getOffset();
        if (start >= total) return Page.empty(pageable);
        int end = Math.min(start + pageable.getPageSize(), total);
        List<MemberMatchResultDto> pageSlice = scored.subList(start, end);

        List<Long> userIds = pageSlice.stream().map(dto -> Long.valueOf(dto.userId())).toList();

        // roles FETCH JOIN + userSkills는 @BatchSize(100)로 IN절 배치 로딩 자동 처리
        Map<Long, User> userMap = userRepository.findUsersWithRolesByIds(userIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));

        List<MemberCardDto> finalContent = pageSlice.stream()
            .map(dto -> {
                User user = userMap.get(Long.valueOf(dto.userId()));
                if (user == null) {
                    log.warn("데이터 불일치 감지: Neo4j에는 존재하나 MySQL에 없는 유저 ID [{}]", dto.userId());
                    return null;
                }
                return MemberCardDto.of(user, dto.graphScore());
            })
            .filter(Objects::nonNull)
            .toList();

        return new PageImpl<>(finalContent, pageable, total);
    }

    @SuppressWarnings("unchecked")
    private List<Double> fetchEmbedding(String label, String keyProp, String keyValue) {
        return neo4jClient
            .query("MATCH (n:" + label + " {" + keyProp + ": $key}) RETURN n.embedding AS embedding")
            .bind(keyValue).to("key")
            .fetch().one()
            .map(row -> (List<Double>) row.get("embedding"))
            .orElse(null);
    }

    private double dotProduct(List<Double> a, List<Double> b) {
        double dot = 0.0;
        int len = Math.min(a.size(), b.size());
        for (int i = 0; i < len; i++) {
            dot += a.get(i) * b.get(i);
        }
        return dot;
    }
}