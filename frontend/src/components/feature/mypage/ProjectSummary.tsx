import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProjectSimple } from '../../../types/project';

// ── 태그 색상 (기술스택 순서 기반으로 blue/yellow/gray 번갈아 적용) ──────────────
const TAG_PALETTE = [
  'bg-[#eff6ff] text-[#2563eb]',
  'bg-[#fefce8] text-[#ca8a04]',
  'bg-[#f3f4f6] text-[#374151]',
] as const;

// ── 프로젝트 카드 ──────────────────────────────────────────────────────────────
const ProjectCard = ({ project }: { project: ProjectSimple }) => (
  <Link
    to={`/projects/${project.projectId}`}
    className="flex gap-5 border-2 border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
  >
    {/* 썸네일 */}
    <div className="w-28 h-28 flex-shrink-0 bg-[#f3f4f6] rounded-xl flex items-center justify-center overflow-hidden">
      {project.imageUrl ? (
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-text-tertiary text-sm">Thumbnail</span>
      )}
    </div>

    {/* 콘텐츠 */}
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <h3 className="text-[16px] font-bold text-text-primary leading-snug">
        {project.title}
      </h3>
      <p className="text-[12px] text-text-secondary leading-[18px]">
        {project.teamName} · {project.domain}
      </p>
      {(project.skills ?? []).length > 0 && (
        <div className="flex gap-2 flex-wrap mt-auto">
          {project.skills.slice(0, 4).map((skill, i) => (
            <span
              key={skill}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${TAG_PALETTE[i % TAG_PALETTE.length]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  </Link>
);

// ── 빈 상태 ────────────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-tertiary">
    <span className="text-3xl">📂</span>
    <p className="text-sm">진행 중인 프로젝트가 없습니다.</p>
  </div>
);

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
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full">
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

      {/* 최신 진행 중 프로젝트 or 빈 상태 */}
      {latestProject ? <ProjectCard project={latestProject} /> : <EmptyState />}
    </div>
  );
};

export default ProjectSummary;
