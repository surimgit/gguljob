import { useState } from 'react';
import ProjectCard from '../components/feature/project/ProjectCard';
import type { Project } from '../components/feature/project/ProjectCard';
import ProjectCarouselCard from '../components/feature/project/ProjectCarouselCard';
import ProjectApplyModal from '../components/feature/project/ProjectApplyModal';

const sampleProjects: Project[] = [
  {
    id: 1,
    category: '인공지능',
    status: '모집중',
    title: 'AI 기반 헬스케어 운동 추천',
    description:
      '건강 데이터 분석을 통한 맞춤형 운동 루틴 추천 서비스. GPT API와 웨어러블 데이터 연동.',
    techStack: ['React', 'Spring Boot', 'Python', 'MySQL'],
    slots: { fe: { current: 2, total: 3 }, be: { current: 1, total: 2 } },
    author: { initial: '김', name: '김수진', avatarColor: '#43b581' },
  },
  {
    id: 2,
    category: '웹기술',
    status: '마감 D-3',
    title: 'VS Code 플러그인 자동화 도구',
    description: '반복적인 코드 패턴을 자동으로 감지하고 리팩터링 제안을 해주는 개발자 도구.',
    techStack: ['TypeScript', 'Node.js'],
    slots: { fe: { current: 1, total: 2 }, be: { current: 2, total: 2 } },
    author: { initial: '박', name: '박지훈', avatarColor: '#6366f1' },
  },
  {
    id: 3,
    category: '모바일',
    status: '마감',
    title: '취미 기반 소셜 매칭 앱',
    description: '같은 취미를 가진 사람들을 연결해주는 소셜 플랫폼.',
    techStack: ['React Native', 'Firebase', 'GraphQL', 'Redis', 'AWS'],
    slots: { fe: { current: 3, total: 3 }, be: { current: 2, total: 2 } },
    author: { initial: '이', name: '이민지' },
  },
];

const ProjectFind = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-2xl font-black text-[#2d2a24] mb-8">ProjectCard 미리보기</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1080px]">
        {sampleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={(p) => setSelectedProject(p)}
          />
        ))}
      </div>

      <h2 className="text-2xl font-black text-[#2d2a24] mt-12 mb-8">ProjectCarouselCard 미리보기</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sampleProjects.map((project) => (
          <ProjectCarouselCard
            key={project.id}
            project={project}
            onClick={(p) => setSelectedProject(p)}
          />
        ))}
      </div>

      {selectedProject && (
        <ProjectApplyModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onApply={(p, pos) => {
            console.log('지원:', p.title, pos);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectFind;
