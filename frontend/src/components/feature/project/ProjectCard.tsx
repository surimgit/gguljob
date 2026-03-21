import type { ProjectCardDto, BackendProjectStatus } from '../../../types/project';
import { getRoleDisplayName, getRoleColor } from '../../../constants/skills';

export interface ProjectCardProps {
  project: ProjectCardDto;
  onClick?: (project: ProjectCardDto) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  웹기술: '#3b82f6',
  웹디자인: '#ec4899',
  모바일: '#f97316',
  AIoT: '#14b8a6',
  인공지능: '#6366f1',
  빅데이터: '#8b5cf6',
  블록체인: '#f59e0b',
  자율주행: '#06b6d4',
  핀테크: '#22c55e',
  메타버스: '#a855f7',
};

const FALLBACK_AVATAR_COLOR = '#6366f1';

const STATUS_LABEL: Record<BackendProjectStatus, string> = {
  RECRUITING: '모집중',
  PROCEEDING: '진행중',
  DONE: '마감',
};

function getStatusStyle(status: BackendProjectStatus) {
  if (status === 'RECRUITING') return { dot: '#43b581', text: '#22c55e' };
  if (status === 'DONE') return { dot: '#9ca3af', text: '#9ca3af' };
  return { dot: '#f59e0b', text: '#f59e0b' };
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const { domain, status, title, description, skills, positions, leaderName, leaderProfileImageUrl } = project;

  const categoryColor = CATEGORY_COLORS[domain] ?? '#6b7280';
  const statusStyle = getStatusStyle(status);

  const activePositions = positions.filter((p) => p.targetCount > 0);

  const visibleTech = skills.slice(0, 3);
  const extraCount = skills.length - visibleTech.length;

  return (
    <a
      className={`border-2 border-[#e5e7eb] cursor-pointer flex flex-col gap-[14px] px-[26px] py-[26px] rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] w-full h-[280px] hover:shadow-lg hover:border-primary-hover hover:bg-primary-soft transition-all duration-300 ${status === 'DONE' ? 'bg-[#EDEBE6]' : 'bg-white'}`}
      onClick={() => onClick?.(project)}
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between w-full">
        <p
          className="font-semibold text-base leading-[18px]"
          style={{ color: categoryColor }}
        >
          {domain}
        </p>
        <div className="flex items-center gap-[5px]">
          <div
            className="rounded-[3.5px] size-[7px]"
            style={{ backgroundColor: statusStyle.dot }}
          />
          <p
            className="font-bold text-sm leading-[18px]"
            style={{ color: statusStyle.text }}
          >
            {STATUS_LABEL[status]}
          </p>
        </div>
      </div>

      {/* 제목 */}
      <p className="font-bold text-text-primary text-xl tracking-[-0.3px] w-full">
        {title}
      </p>

      {/* 설명 */}
      <p className="font-bold text-text-secondary text-sm leading-[20.8px] line-clamp-2 w-full">
        {description}
      </p>

      {/* 기술스택 뱃지 */}
      <div className="flex flex-wrap gap-x-[5px] gap-y-[5px] w-full">
        {visibleTech.map((tech) => (
          <span
            key={tech}
            className="bg-[#e5e7eb] border border-[#e5e7eb] font-semibold text-[#6b7280] text-xs px-[11px] py-[4px] rounded-[16px] mt-2"
          >
            {tech}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="bg-[#e5e7eb] border border-[#e5e7eb] font-semibold text-[#6b7280] text-xs px-[11px] py-[4px] rounded-[16px] mt-2">
            +{extraCount}
          </span>
        )}
      </div>

      {/* 하단: 포지션 슬롯 + 작성자 */}
      <div className="mt-auto border-t border-[#f0ebe3] flex items-center justify-between pt-[11px] w-full">
        <div className="flex gap-[12px]">
          {activePositions.map((pos) => (
            <p key={pos.positionId} className="font-semibold text-xs" style={{ color: getRoleColor(pos.role) }}>
              {getRoleDisplayName(pos.role)} <span className="font-black">{pos.currentCount}/{pos.targetCount}</span>
            </p>
          ))}
        </div>
        <div className="flex items-center gap-[8px]">
          {leaderProfileImageUrl ? (
            <img
              src={leaderProfileImageUrl}
              alt={leaderName}
              className="rounded-full size-[24px] object-cover"
            />
          ) : (
            <div
              className="rounded-full size-[24px] flex items-center justify-center"
              style={{ backgroundColor: FALLBACK_AVATAR_COLOR }}
            >
              <p className="font-bold text-white text-[11px]">{leaderName?.[0] ?? '?'}</p>
            </div>
          )}
          <p className="font-semibold text-text-secondary text-sm">{leaderName}</p>
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
