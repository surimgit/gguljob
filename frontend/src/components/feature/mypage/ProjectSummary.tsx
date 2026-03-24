import { ChevronRight, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProjectSimple } from '../../../types/project';
import { SectionEmptyState } from '../../common';
import { THUMBNAIL_GRADIENTS } from '../../../constants/domains';

// ── 태그 색상 (기술스택 순서 기반으로 blue/yellow/gray 번갈아 적용) ──────────────
const TAG_PALETTE = [
  'bg-[#eff6ff] text-[#2563eb]',
  'bg-[#fefce8] text-[#ca8a04]',
  'bg-[#f3f4f6] text-[#374151]',
] as const;

// ── 프로젝트 카드 ──────────────────────────────────────────────────────────────
const ProjectCard = ({ project }: { project: ProjectSimple }) => {
  const gradient = THUMBNAIL_GRADIENTS[project.domain] ?? 'linear-gradient(135deg, #F5F5F5, #E0E0E0)';

  return (
  <Link
    to={`/my-projects/${project.projectId}`}
    className="flex items-start gap-6 border-2 border-border rounded-2xl p-6 hover:bg-primary-soft hover:border-primary-hover hover:shadow-md transition-all duration-200 h-full"
  >
    {/* 썸네일 */}
    <div
      className="w-36 h-full min-h-[9rem] flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
      style={{ background: project.imageUrl ? undefined : gradient }}
    >
      {project.imageUrl ? (
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Camera className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.6)' }} />
      )}
    </div>

    {/* 콘텐츠 */}
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <h3 className="text-[18px] font-bold text-text-primary leading-snug">
        {project.title}
      </h3>
      <p className="text-[13px] text-text-secondary leading-[20px]">
        {project.teamName} · {project.domain}
      </p>
      {(project.skills ?? []).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {project.skills.slice(0, 4).map((skill, i) => (
            <span
              key={skill}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${TAG_PALETTE[i % TAG_PALETTE.length]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  </Link>
  );
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
interface ProjectSummaryProps {
  projects: ProjectSimple[];
}

const ProjectSummary = ({ projects }: ProjectSummaryProps) => {
  // DONE이 아닌 프로젝트(모집중/진행중) 중 가장 최신 1개
  const latestProject = [...projects]
    .filter((p) => p.status !== 'DONE')
    .at(-1) ?? null;

  return (
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
          <span>✨</span>
          <span>프로젝트</span>
        </h2>
        <Link
          to="/my-projects"
          className="text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="프로젝트 전체보기"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* 최신 진행 중 프로젝트 or 빈 상태 — 남은 공간 채움 */}
      <div className="flex-1">
        {latestProject ? <ProjectCard project={latestProject} /> : <SectionEmptyState message="등록된 프로젝트가 없어요." />}
      </div>
    </div>
  );
};

export default ProjectSummary;
