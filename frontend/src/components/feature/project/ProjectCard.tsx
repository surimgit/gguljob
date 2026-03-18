import { useState } from 'react';

export type ProjectStatus = '모집중' | '마감' | `마감 D-${number}`;

export interface Project {
  id: number;
  category: string;
  status: ProjectStatus;
  title: string;
  description: string;
  techStack: string[];
  slots: {
    fe: { current: number; total: number; positionId?: number };
    be: { current: number; total: number; positionId?: number };
  };
  author: {
    initial: string;
    name: string;
    avatarColor?: string;
  };
}

export interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
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

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? '#6b7280';

function getStatusStyle(status: ProjectStatus) {
  if (status === '모집중') return { dot: '#43b581', text: '#22c55e' };
  if (status === '마감') return { dot: '#9ca3af', text: '#9ca3af' };
  return { dot: '#f59e0b', text: '#f59e0b' };
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const [hovered, setHovered] = useState(false);
  const { category, status, title, description, techStack, slots, author } =
    project;

  const categoryColor = getCategoryColor(category);
  const statusStyle = getStatusStyle(status);
  const avatarColor = author.avatarColor ?? '#43b581';

  const visibleTech = techStack.slice(0, 3);
  const extraCount = techStack.length - visibleTech.length;

  const bgColor = hovered
    ? '#FFF2C6'
    : status === '마감'
    ? '#EDEBE6'
    : '#ffffff';

  return (
    <a
      className="border-2 border-[#e5e7eb] cursor-pointer flex flex-col gap-[14px] px-[26px] py-[26px] rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] w-full hover:shadow-lg hover:border-[#f2b705] transition-all duration-300"
      style={{ backgroundColor: bgColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(project)}
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between w-full">
        <p
          className="font-bold text-[12px] leading-[18px]"
          style={{ color: categoryColor }}
        >
          {category}
        </p>
        <div className="flex items-center gap-[5px]">
          <div
            className="rounded-[3.5px] size-[7px]"
            style={{ backgroundColor: statusStyle.dot }}
          />
          <p
            className="font-bold text-[12px] leading-[18px]"
            style={{ color: statusStyle.text }}
          >
            {status}
          </p>
        </div>
      </div>

      {/* 제목 */}
      <p className="font-black text-[#2d2a24] text-[17px] tracking-[-0.3px] w-full">
        {title}
      </p>

      {/* 설명 */}
      <p className="font-bold text-[#8a8073] text-[13px] leading-[20.8px] line-clamp-3 w-full">
        {description}
      </p>

      {/* 기술스택 뱃지 */}
      <div className="flex flex-wrap gap-x-[5px] gap-y-[5px] w-full">
        {visibleTech.map((tech) => (
          <span
            key={tech}
            className="bg-[#e5e7eb] border border-[#e5e7eb] font-bold text-[#6b7280] text-[11.5px] px-[11px] py-[4px] rounded-[16px]"
          >
            {tech}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="bg-[#e5e7eb] border border-[#e5e7eb] font-bold text-[#6b7280] text-[11.5px] px-[11px] py-[4px] rounded-[16px]">
            +{extraCount}
          </span>
        )}
      </div>

      {/* 하단: 포지션 슬롯 + 작성자 */}
      <div className="mt-auto border-t border-[#f0ebe3] flex items-center justify-between pt-[11px] w-full">
        <div className="flex gap-[12px]">
          <p className="font-bold text-[#2196f3] text-[12px]">
            FE{' '}
            <span className="font-black">
              {slots.fe.current}/{slots.fe.total}
            </span>
          </p>
          <p className="font-bold text-[#22c55e] text-[12px]">
            BE{' '}
            <span className="font-black">
              {slots.be.current}/{slots.be.total}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-[8px]">
          <div
            className="rounded-full size-[24px] flex items-center justify-center"
            style={{ backgroundColor: avatarColor }}
          >
            <p className="font-bold text-white text-[11px]">{author.initial}</p>
          </div>
          <p className="font-bold text-[#8a8073] text-[12px]">{author.name}</p>
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
