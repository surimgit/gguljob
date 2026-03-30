package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.entity.UserNode;
import com.ssafy.gguljob.backend.domain.matching.repository.UserNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class Neo4jGraphService {

    private final UserNodeRepository userNodeRepository;

    @Transactional(transactionManager = "neo4jTransactionManager")
    public void saveUserNode(UserNode newUserNode, Long userId) {
        userNodeRepository.findById(userId).ifPresentOrElse(
            existingNode -> {
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
