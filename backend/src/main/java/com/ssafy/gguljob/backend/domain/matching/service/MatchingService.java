package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.dto.ProjectMatchResultDto;
import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final ProjectNodeRepository projectNodeRepository;

    @Transactional(readOnly = true, transactionManager = "neo4jTransactionManager")
    public Page<ProjectMatchResultDto> getRecommendedProjects(Long userId, Pageable pageable) {
        Pageable unsortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        return projectNodeRepository.findRecommendedProjectsForUser(String.valueOf(userId), unsortedPageable);
    }
}