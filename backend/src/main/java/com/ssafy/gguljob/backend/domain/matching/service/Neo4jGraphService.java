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
    public void saveUserNode(UserNode userNode, Long userId) {
        userNodeRepository.deleteById(String.valueOf(userId));
        userNodeRepository.save(userNode);
        log.info("🌐 Neo4j 그래프 DB 동기화 완료: 유저 ID = {}", userId);
    }
}