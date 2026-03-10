import type { Project } from '../types/project';

export const mockProjects: Project[] = [
  {
    id: 1,
    title: '꿀잡 - 개발자 프로젝트 매칭 플랫폼',
    description: 'React + Spring Boot 기반 개발자 팀 빌딩 서비스',
    techStacks: ['React', 'TypeScript', 'Spring Boot', 'PostgreSQL'],
    status: 'RECRUITING',
    teamSize: 6,
    currentMembers: 4,
    createdAt: '2026-03-01',
  },
  {
    id: 2,
    title: '실시간 협업 코드 에디터',
    description: 'WebSocket 기반 다중 사용자 실시간 코드 편집 도구',
    techStacks: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
    status: 'IN_PROGRESS',
    teamSize: 4,
    currentMembers: 4,
    createdAt: '2026-02-15',
  },
];
