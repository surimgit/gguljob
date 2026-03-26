package com.ssafy.gguljob.backend.domain.matching.event;

import com.ssafy.gguljob.backend.domain.matching.repository.ProjectNodeRepository;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectPositionRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.type.ProjectStatus;
import com.ssafy.gguljob.backend.domain.matching.util.MatchingFilterNormalizer;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectSyncEventListener {

    private final ProjectRepository projectRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectPositionRepository projectPositionRepository;
    private final ProjectNodeRepository projectNodeRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(transactionManager = "neo4jTransactionManager", propagation = Propagation.REQUIRES_NEW)
    public void handleProjectSync(ProjectSyncEvent event) {
        log.info("Neo4j 동기화 이벤트 수신: 프로젝트 ID [{}]", event.id());

        Project project = projectRepository.findById(event.id()).orElse(null);

        if (project == null || project.getStatus() != ProjectStatus.RECRUITING) {
            projectNodeRepository.deleteById(String.valueOf(event.id()));
            log.info("프로젝트 [{}]는 모집 중이 아니므로 Neo4j 동기화를 스킵합니다.", event.id());
            return;
        }

        List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());
        List<String> roles = projectPositionRepository.findAllByProjectId(project.getId())
            .stream().map(p -> MatchingFilterNormalizer.toNeo4jRoleName(p.getRole())).toList();

        projectNodeRepository.syncProjectToNeo4j(
            String.valueOf(project.getId()),
            project.getTitle(),
            (project.getDomain() != null) ? project.getDomain().name() : "미정",
            project.getStatus().name(),
            roles,
            skills
        );

        log.info("Neo4j 동기화 완료: 프로젝트 ID [{}]", event.id());
    }
}