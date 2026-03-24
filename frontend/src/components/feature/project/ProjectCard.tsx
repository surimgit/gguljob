import type { ProjectCardDto, BackendProjectStatus } from '../../../types/project';
import { getRoleDisplayName, getRoleColor } from '../../../constants/skills';
import { CATEGORY_COLORS } from '../../../constants/domains';

const THUMBNAIL_GRADIENTS: Record<string, string> = {
  웹기술:   'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  웹디자인: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  모바일:   'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  AIoT:    'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
  인공지능: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  빅데이터: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
  블록체인: 'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  자율주행: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  핀테크:   'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  메타버스: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
};

export interface ProjectCardProps {
  project: ProjectCardDto;
  onClick?: (project: ProjectCardDto) => void;
}

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
  const { domain, status, title, description, skills, positions, leaderName, leaderProfileImageUrl, imageUrl } = project;

  const categoryColor = CATEGORY_COLORS[domain] ?? '#6b7280';
  const statusStyle = getStatusStyle(status);
  const gradient = THUMBNAIL_GRADIENTS[domain] ?? 'linear-gradient(135deg, #F5F5F5, #E0E0E0)';

  const activePositions = Object.values(
    positions
      .filter((p) => p.targetCount > 0)
      .reduce<Record<string, typeof positions[number]>>((acc, p) => {
        if (acc[p.role]) {
          acc[p.role] = {
            ...acc[p.role],
            currentCount: acc[p.role].currentCount + p.currentCount,
            targetCount: acc[p.role].targetCount + p.targetCount,
          };
        } else {
          acc[p.role] = { ...p };
        }
        return acc;
      }, {}),
  );

  const visibleTech = skills.slice(0, 3);
  const extraCount = skills.length - visibleTech.length;

  return (
    <a
      className={`border-2 border-[#e5e7eb] cursor-pointer flex flex-col rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] w-full min-h-[280px] hover:shadow-lg hover:border-primary-hover hover:bg-primary-soft transition-all duration-300 overflow-hidden ${status === 'DONE' ? 'bg-[#EDEBE6]' : 'bg-white'}`}
      onClick={() => onClick?.(project)}
    >
      {/* 썸네일 */}
      <div
        className="w-full h-[120px] relative flex-shrink-0"
        style={{ background: imageUrl ? undefined : gradient }}
      >
        {imageUrl && (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-[8px] right-[8px] bg-[rgba(255,255,255,0.75)] rounded-[8px] px-[8px] py-[2px]">
          <p className="font-semibold text-xs" style={{ color: categoryColor }}>{domain}</p>
        </div>
      </div>

      <div className="flex flex-col gap-[14px] px-[20px] py-[18px] flex-1">
      {/* 상단: 상태(좌) + 작성자(우) */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-[5px]">
          <div
            className="rounded-[3.5px] size-[5px]"
            style={{ backgroundColor: statusStyle.dot }}
          />
          <p
            className="font-semibold text-xs leading-[18px]"
            style={{ color: statusStyle.text }}
          >
            {STATUS_LABEL[status]}
          </p>
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

      {/* 하단: 포지션 슬롯 */}
      <div className="mt-auto border-t border-[#f0ebe3] flex flex-wrap gap-x-[12px] gap-y-[4px] pt-[11px] w-full">
        {activePositions.map((pos) => (
          <p key={pos.positionId} className="font-semibold text-xs whitespace-nowrap" style={{ color: getRoleColor(pos.role) }}>
            {getRoleDisplayName(pos.role)} <span className="font-black">{pos.currentCount}/{pos.targetCount}</span>
          </p>
        ))}
      </div>
      </div>{/* 콘텐츠 영역 끝 */}
    </a>
  );
};

export default ProjectCard;
