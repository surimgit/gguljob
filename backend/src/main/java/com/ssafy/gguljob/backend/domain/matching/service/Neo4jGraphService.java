package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.entity.ProjectNode;
import com.ssafy.gguljob.backend.domain.matching.entity.UserNode;
import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
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
    private final ProjectNodeRepository projectNodeRepository;

    @Transactional(transactionManager = "neo4jTransactionManager")
    public void saveUserNode(UserNode newUserNode, Long userId) {
        userNodeRepository.findById(String.valueOf(userId)).ifPresentOrElse(
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

    @Transactional(transactionManager = "neo4jTransactionManager")
    public void saveProjectNode(ProjectNode newProjectNode, Long projectId) {
        projectNodeRepository.findById(String.valueOf(projectId)).ifPresentOrElse(
            existingNode -> {
                existingNode.updateFrom(newProjectNode);
                projectNodeRepository.save(existingNode);
                log.info("Neo4j 프로젝트 노드 '업데이트' 완료: ID = {}", projectId);
            },
            () -> {
                projectNodeRepository.save(newProjectNode);
                log.info("Neo4j 프로젝트 노드 '신규 생성' 완료: ID = {}", projectId);
            }
        );
    }
}