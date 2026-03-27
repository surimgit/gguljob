import type { ProjectCardDto } from '../../../types/project';
import { CATEGORY_COLORS } from '../../../constants/domains';
import defaultThumbnail from '../../../assets/images/project_photo2.png';

export interface ProjectCarouselCardProps {
  project: ProjectCardDto;
  onClick?: (project: ProjectCardDto) => void;
}

const ProjectCarouselCard = ({ project, onClick }: ProjectCarouselCardProps) => {
  const { domain, title, description, imageUrl } = project;

  const categoryColor = CATEGORY_COLORS[domain] ?? '#6b7280';

  return (
    <div
      className="bg-white border border-[#f0ebe3] overflow-hidden relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] w-[250px] h-[200px] flex-shrink-0 cursor-pointer text-left transition-all duration-300 hover:scale-[1.06] hover:shadow-[0px_12px_32px_0px_rgba(0,0,0,0.14)]"
      onClick={() => onClick?.(project)}
    >
      {/* 상단 썸네일 */}
      <div
        className={`absolute top-0 left-0 w-full h-[100px] overflow-hidden bg-[#f0ebe3] ${!imageUrl ? 'flex justify-center items-center' : ''}`}
      >
        <img
          src={imageUrl || defaultThumbnail}
          alt={title}
          className={imageUrl ? 'w-full h-full object-cover' : 'h-[70%] object-contain'}
        />
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
