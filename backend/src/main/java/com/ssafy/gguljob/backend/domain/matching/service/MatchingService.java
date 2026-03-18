package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final ProjectNodeRepository projectNodeRepository;

    @Transactional(readOnly = true, transactionManager = "neo4jTransactionManager")
    public List<ProjectMatchResultDto> getRecommendedProjects(Long userId) {
        log.info("유저 ID [{}] 맞춤형 프로젝트 추천 매칭 스코어 계산 시작!", userId);

        List<ProjectMatchResultDto> recommendedProjects =
            projectNodeRepository.findRecommendedProjectsForUser(String.valueOf(userId));

        log.info("매칭된 프로젝트 총 {}개 발견!", recommendedProjects.size());
        return recommendedProjects;
    }
}