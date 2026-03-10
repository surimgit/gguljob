package com.ssafy.gguljob.backend.domain.project.service;

import com.ssafy.gguljob.backend.domain.project.dto.ProjectRequest;
import com.ssafy.gguljob.backend.domain.project.dto.ProjectResponse;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.entity.ProjectMember;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectMemberRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectSkillRepository;
import com.ssafy.gguljob.backend.domain.project.type.MemberStatus;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import com.ssafy.gguljob.backend.global.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectSkillRepository projectSkillRepository;

    @Transactional
    public ProjectResponse.Id createProject(Long userId, ProjectRequest.Create request) {

        User leader = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("해당 ID의 사용자를 찾을 수 없습니다."));

        Project project = Project.builder()
            .leader(leader)
            .title(request.title())
            .teamName(request.teamName())
            .domain(request.domain())
            .description(request.description())
            .isPublic(request.isPublic())
            .imageUrl(request.imageUrl())
            .documentUrl(request.documentUrl())
            .build();

        Project savedProject = projectRepository.save(project);
        ProjectMember projectMember = ProjectMember.builder()
            .project(savedProject)
            .user(leader)
            .role(request.leaderRole())
            .build();

        projectMemberRepository.save(projectMember);

        return ProjectResponse.Id.from(savedProject);
    }

    public List<ProjectResponse.Simple> getMyProjects(Long userId) {

        List<ProjectMember> memberships = projectMemberRepository.findActiveProjectsByUserId(userId,
            MemberStatus.ATTEND);

        return memberships.stream().map(membership -> {
            Project project = membership.getProject();

            // 역할별 인원수 계산
            Map<String, Long> roleCounts = projectMemberRepository.countRolesByProjectId(
                    project.getId())
                .stream()
                .collect(Collectors.toMap(
                    row -> row[0].toString(),
                    row -> (Long) row[1]
                ));

            // 스킬 이름 최대 4개 조회
            List<String> skills = projectSkillRepository.findTop4SkillNamesByProjectId(
                project.getId(), PageRequest.of(0, 4)
            );

            return ProjectResponse.Simple.of(project, roleCounts, skills);
        }).collect(Collectors.toList());
    }
}
