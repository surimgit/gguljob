package com.ssafy.gguljob.backend.domain.matching.service;

import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import com.ssafy.gguljob.backend.domain.matching.util.MatchingFilterNormalizer;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class Neo4jProjectSyncBatchService {

    private final ProjectRepository projectRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectPositionRepository projectPositionRepository;
    private final ProjectNodeRepository projectNodeRepository;
    @Qualifier("neo4jTransactionManager")
    private final PlatformTransactionManager neo4jTransactionManager;

    public int syncRecruitingProjectsToNeo4j() {
        List<Project> recruitingProjects = projectRepository.findAllByStatus(ProjectStatus.RECRUITING);
        int successCount = 0;
        int failCount = 0;
        TransactionTemplate txTemplate = new TransactionTemplate(neo4jTransactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        for (Project project : recruitingProjects) {
            try {
                txTemplate.executeWithoutResult(status -> syncSingleProject(project));
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.error("Neo4j 프로젝트 동기화 실패: projectId={}", project.getId(), e);
            }
        }

        log.info("Neo4j 프로젝트 재동기화 완료: 대상={}건, 성공={}건, 실패={}건",
            recruitingProjects.size(), successCount, failCount);
        return successCount;
    }

    private void syncSingleProject(Project project) {
        List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());
        List<String> roles = projectPositionRepository.findAllByProjectId(project.getId())
            .stream()
            .map(position -> MatchingFilterNormalizer.toNeo4jRoleName(position.getRole()))
            .toList();

        projectNodeRepository.syncProjectToNeo4j(
            String.valueOf(project.getId()),
            project.getTitle(),
            project.getDomain() != null ? project.getDomain().name() : "미정",
            project.getStatus().name(),
            roles,
            skills
        );
    }
}
