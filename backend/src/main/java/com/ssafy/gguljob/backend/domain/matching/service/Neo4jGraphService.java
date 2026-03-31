package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.entity.UserNode;
import com.ssafy.gguljob.backend.domain.matching.repository.UserNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class Neo4jGraphService {

    private final UserNodeRepository userNodeRepository;
    private final Neo4jClient neo4jClient;

    @Transactional(transactionManager = "neo4jTransactionManager")
    public void saveUserNode(UserNode newUserNode, Long userId) {
        userNodeRepository.findById(userId).ifPresentOrElse(
            existingNode -> {
                // SDN은 equals/hashCode 없이 관계 diff를 못 계산하므로 기존 관계를 먼저 명시적으로 삭제
                // 의도적으로 관계 타입을 열거: PARTICIPATED_IN은 syncParticipatedProjects에서 별도 관리하므로 여기서 삭제하면 안 됨
                neo4jClient.query("MATCH (u:User {id: $uid})-[r:HAS_SKILL|WANTS_ROLE|HAS_MBTI|HAS_TENDENCY|HAS_EXPERIENCE|PURSUES_GOAL]->() DELETE r")
                    .bind(userId).to("uid").run();
                existingNode.updateFrom(newUserNode);
                userNodeRepository.save(existingNode);
                log.info("Neo4j 유저 노드 '업데이트' 완료: ID = {}", userId);
            },
            () -> {
                userNodeRepository.save(newUserNode);
                log.info("Neo4j 유저 노드 '신규 생성' 완료: ID = {}", userId);
            }
        );
    }
}
