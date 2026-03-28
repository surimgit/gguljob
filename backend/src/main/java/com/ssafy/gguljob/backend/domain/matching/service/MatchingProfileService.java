package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.entity.*;
import com.ssafy.gguljob.backend.domain.matching.util.MatchingFilterNormalizer;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingProfileService {

    private final UserRepository userRepository;
    private final Neo4jGraphService neo4jGraphService; // 🚀 방금 만든 Neo4j 전담 용병 주입!

    // 🚀 여기는 JPA 대장님 구역! (읽기 전용이라 성능도 빠름)
    @Transactional(readOnly = true)
    public void syncUserProfileToGraph(Long userId) {
        log.info("Neo4j 그래프 DB 조립 시작: 유저 ID = {}", userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("동기화할 유저를 찾을 수 없습니다."));

        var skillNodes = user.getUserSkills().stream()
            .map(us -> SkillNode.builder().id(us.getSkill().getId()).name(us.getSkill().getName()).build())
            .collect(Collectors.toSet());

        var roleNodes = user.getRoles().stream()
            .map(role -> RoleNode.builder().name(MatchingFilterNormalizer.toNeo4jRoleName(role)).build())
            .collect(Collectors.toSet());

        var goalNodes = user.getGoals().stream()
            .map(goal -> GoalNode.builder().name(goal.getGoal().name()).build())
            .collect(Collectors.toSet());

        var mbtiNode = StringUtils.hasText(user.getMbti()) ? MbtiNode.builder().type(user.getMbti()).build() : null;
        var tendencyNode = user.getTeamTendency() != null ? TendencyNode.builder().type(user.getTeamTendency().name()).build() : null;
        var expNode = user.getExperience() != null ? ExperienceNode.builder().level(user.getExperience().name()).build() : null;

        UserNode userNode = UserNode.builder()
            .id(user.getId())
            .userName(user.getUserName())
            .skills(skillNodes)
            .roles(roleNodes)
            .goals(goalNodes)
            .mbti(mbtiNode)
            .tendency(tendencyNode)
            .experience(expNode)
            .build();

        neo4jGraphService.saveUserNode(userNode, userId);
    }
}