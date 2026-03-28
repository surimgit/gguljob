package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.entity.*;
import com.ssafy.gguljob.backend.domain.matching.util.MatchingFilterNormalizer;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingProfileService {

    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final Neo4jGraphService neo4jGraphService;
    private final Neo4jClient neo4jClient;

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
            .experienceLevel(user.getExperience() != null ? user.getExperience().name() : null)
            .skills(skillNodes)
            .roles(roleNodes)
            .goals(goalNodes)
            .mbti(mbtiNode)
            .tendency(tendencyNode)
            .experience(expNode)
            .build();

        neo4jGraphService.saveUserNode(userNode, userId);
        syncParticipatedProjects(user);
    }

    private void syncParticipatedProjects(User user) {
        List<Long> projectIds = projectMemberRepository
            .findActiveProjectsByUserId(user.getId(), MemberStatus.ATTEND)
            .stream()
            .map(pm -> pm.getProject().getId())
            .toList();

        // 기존 PARTICIPATED_IN 관계 삭제 후 재생성
        neo4jClient.query("""
                MATCH (u:User {id: $userId})-[r:PARTICIPATED_IN]->()
                DELETE r
                """)
            .bind(user.getId()).to("userId")
            .run();

        if (!projectIds.isEmpty()) {
            List<String> projectIdStrs = projectIds.stream()
                .map(String::valueOf)
                .toList();

            neo4jClient.query("""
                    MATCH (u:User {id: $userId})
                    UNWIND $projectIds AS pid
                    MATCH (p:Project {id: pid})
                    MERGE (u)-[:PARTICIPATED_IN]->(p)
                    """)
                .bind(user.getId()).to("userId")
                .bind(projectIdStrs).to("projectIds")
                .run();
        }

        log.info("유저 프로젝트 참여 이력 동기화 완료: userId={}, 참여 프로젝트 {}건",
            user.getId(), projectIds.size());
    }
}