import type { ProjectCardDto } from '../../../types/project';
import ProjectCarouselCard from './ProjectCarouselCard';

interface AutoScrollCarouselProps {
  direction: 'left' | 'right';
  cards: ProjectCardDto[];
  onCardClick?: (project: ProjectCardDto) => void;
}

const AutoScrollCarousel = ({ direction, cards, onCardClick }: AutoScrollCarouselProps) => {
  const duplicated = [...cards, ...cards];

  return (
    <div className="py-[10px]">
      <div
        className={
          direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
        }
        style={{ display: 'flex', gap: '16px', width: 'max-content' }}
      >
        {duplicated.map((project, index) => (
          <ProjectCarouselCard key={`${project.projectId}-${index}`} project={project} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
};

export default AutoScrollCarousel;
