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

import com.ssafy.gguljob.backend.domain.project.entity.ProjectPosition;

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

        // 모집 중이 아닌 프로젝트 → 노드 삭제
        if (project == null || project.getStatus() != ProjectStatus.RECRUITING) {
            projectNodeRepository.deleteById(String.valueOf(event.id()));
            log.info("프로젝트 [{}]는 모집 중이 아니므로 Neo4j에서 삭제합니다.", event.id());
            return;
        }

        // 빈 포지션이 없는 프로젝트 (모집 인원 다 참) → 노드 삭제
        List<ProjectPosition> positions = projectPositionRepository.findAllByProjectId(project.getId());
        boolean hasOpenPosition = positions.stream()
            .anyMatch(p -> p.getCurrentCount() < p.getTargetCount());

        if (!hasOpenPosition) {
            projectNodeRepository.deleteById(String.valueOf(event.id()));
            log.info("프로젝트 [{}]는 모집 인원이 모두 충원되어 Neo4j에서 삭제합니다.", event.id());
            return;
        }

        List<String> skills = projectSkillRepository.findAllSkillNamesByProjectId(project.getId());
        List<String> roles = positions.stream()
            .map(p -> MatchingFilterNormalizer.toNeo4jRoleName(p.getRole())).toList();

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