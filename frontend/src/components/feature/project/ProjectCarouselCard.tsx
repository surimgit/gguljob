import type { ProjectCardDto } from '../../../types/project';
import { CATEGORY_COLORS, THUMBNAIL_GRADIENTS } from '../../../constants/domains';

export interface ProjectCarouselCardProps {
  project: ProjectCardDto;
  onClick?: (project: ProjectCardDto) => void;
}

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
  const { domain, title, description, skills, imageUrl } = project;

  const gradient = THUMBNAIL_GRADIENTS[domain] ?? 'linear-gradient(149deg, #F5F5F5, #E0E0E0)';
  const categoryColor = CATEGORY_COLORS[domain] ?? '#6b7280';

  const visibleTech = skills.slice(0, 2);
  const extraCount = skills.length - visibleTech.length;

  return (
    <div
      className="bg-white border border-[#f0ebe3] overflow-hidden relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] w-[250px] h-[200px] flex-shrink-0 cursor-pointer text-left transition-all duration-300 hover:scale-[1.06] hover:shadow-[0px_12px_32px_0px_rgba(0,0,0,0.14)]"
      onClick={() => onClick?.(project)}
    >
      {/* 상단 썸네일 */}
      <div
        className="absolute top-0 left-0 w-full h-[100px] overflow-hidden"
        style={{ background: imageUrl ? undefined : gradient }}
      >
        {imageUrl && (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        )}
        {/* 카테고리 뱃지 */}
        <div className="absolute top-[10px] right-[10px] bg-[rgba(255,255,255,0.7)] rounded-[8px] px-[8px] py-[2px]">
          <p className="font-semibold text-sm leading-[15px]" style={{ color: categoryColor }}>
            {domain}
          </p>
        </div>
      </div>

      {/* 하단 정보 영역 */}
      <div className="absolute top-[100px] left-0 w-full bottom-0 flex flex-col px-[16px] pt-[15px] pb-[8px]">

        {/* 제목 */}
        <p className="font-semibold text-text-primary text-base leading-[20px] truncate">
          {title}
        </p>

        {/* 설명 */}
        <p className="mt-[10px] font-medium text-text-secondary text-xs leading-[17.5px] line-clamp-2 flex-1">
          {description}
        </p>
      </div>
    </div>
  );
};

export default ProjectCarouselCard;
