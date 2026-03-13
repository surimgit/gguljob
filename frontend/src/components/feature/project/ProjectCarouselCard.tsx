import type { Project } from './ProjectCard';

export interface ProjectCarouselCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

const THUMBNAIL_GRADIENTS: Record<string, string> = {
  웹기술:   'linear-gradient(149deg, #E3F2FD, #BBDEFB)',
  웹디자인: 'linear-gradient(149deg, #FCE4EC, #F8BBD0)',
  모바일:   'linear-gradient(149deg, #FFF3E0, #FFE0B2)',
  AIoT:    'linear-gradient(149deg, #E0F2F1, #B2DFDB)',
  인공지능: 'linear-gradient(149deg, #E8EAF6, #C5CAE9)',
  빅데이터: 'linear-gradient(149deg, #EDE7F6, #D1C4E9)',
  블록체인: 'linear-gradient(149deg, #FFFDE7, #FFF9C4)',
  자율주행: 'linear-gradient(149deg, #E0F7FA, #B2EBF2)',
  핀테크:   'linear-gradient(149deg, #E8F5E9, #C8E6C9)',
  메타버스: 'linear-gradient(149deg, #F3E5F5, #E1BEE7)',
};

const CATEGORY_COLORS: Record<string, string> = {
  웹기술:   '#3b82f6',
  웹디자인: '#ec4899',
  모바일:   '#f97316',
  AIoT:    '#14b8a6',
  인공지능: '#6366f1',
  빅데이터: '#8b5cf6',
  블록체인: '#f59e0b',
  자율주행: '#06b6d4',
  핀테크:   '#22c55e',
  메타버스: '#a855f7',
};

const TECH_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  React:         { bg: '#e8f4fd', border: '#bbdefb', text: '#2196f3' },
  TypeScript:    { bg: '#e8eaf6', border: '#c5cae9', text: '#3f51b5' },
  'Vue.js':      { bg: '#e8f5e9', border: '#a5d6a7', text: '#2e7d32' },
  'Next.js':     { bg: '#fafafa', border: '#e0e0e0', text: '#212121' },
  'Spring Boot': { bg: '#e8f5e9', border: '#a5d6a7', text: '#388e3c' },
  'Node.js':     { bg: '#f1f8e9', border: '#c5e1a5', text: '#558b2f' },
  Python:        { bg: '#fffde7', border: '#fff176', text: '#f57f17' },
  FastAPI:       { bg: '#e0f2f1', border: '#80cbc4', text: '#00695c' },
  Django:        { bg: '#e8f5e9', border: '#a5d6a7', text: '#1b5e20' },
};

const DEFAULT_TECH_STYLE = { bg: '#f5f5f5', border: 'transparent', text: '#8a8073' };

const ProjectCarouselCard = ({ project, onClick }: ProjectCarouselCardProps) => {
  const { category, title, description, techStack } = project;

  const gradient = THUMBNAIL_GRADIENTS[category] ?? 'linear-gradient(149deg, #F5F5F5, #E0E0E0)';
  const categoryColor = CATEGORY_COLORS[category] ?? '#6b7280';

  const visibleTech = techStack.slice(0, 2);
  const extraCount = techStack.length - visibleTech.length;

  return (
    <div
      className="bg-white border border-[#f0ebe3] overflow-hidden relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] w-[300px] h-[300px] flex-shrink-0 hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
      onClick={() => onClick?.(project)}
    >
      {/* 상단 썸네일 */}
      <div
        className="absolute top-0 left-0 w-full h-[160px] overflow-hidden"
        style={{ background: gradient }}
      >
        {/* 카테고리 뱃지 */}
        <div className="absolute top-[10px] right-[10px] bg-[rgba(255,255,255,0.7)] rounded-[8px] px-[8px] py-[2px]">
          <p className="font-bold text-[10px] leading-[15px]" style={{ color: categoryColor }}>
            {category}
          </p>
        </div>
      </div>

      {/* 하단 정보 영역 */}
      <div className="absolute top-[160px] left-0 w-full bottom-0 flex flex-col px-[16px] pt-[22px] pb-[14px]">

        {/* 제목 */}
        <p className="font-black text-[#2d2a24] text-[15px] leading-[20px] truncate">
          {title}
        </p>

        {/* 설명 */}
        <p className="mt-[6px] font-extrabold text-[#a09888] text-[12.5px] leading-[17.5px] line-clamp-2 flex-1">
          {description}
        </p>

        {/* 기술스택 뱃지 */}
        <div className="mt-[12px] flex items-center gap-[4px]">
          {visibleTech.map((tech) => {
            const style = TECH_BADGE_STYLES[tech] ?? DEFAULT_TECH_STYLE;
            return (
              <span
                key={tech}
                className="h-[21px] rounded-[12px] px-[9px] py-[3px] font-bold text-[10px] leading-[15px] border"
                style={{ backgroundColor: style.bg, borderColor: style.border, color: style.text }}
              >
                {tech}
              </span>
            );
          })}
          {extraCount > 0 && (
            <span className="h-[21px] bg-[#f5f5f5] rounded-[12px] px-[6px] py-[2px] font-bold text-[#8a8073] text-[10px] leading-[15px]">
              +{extraCount}
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProjectCarouselCard;
