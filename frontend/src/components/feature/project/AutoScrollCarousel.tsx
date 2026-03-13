import type { Project } from './ProjectCard';
import ProjectCarouselCard from './ProjectCarouselCard';

interface AutoScrollCarouselProps {
  direction: 'left' | 'right';
  cards: Project[];
}

const AutoScrollCarousel = ({ direction, cards }: AutoScrollCarouselProps) => {
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
          <ProjectCarouselCard key={`${project.id}-${index}`} project={project} />
        ))}
      </div>
    </div>
  );
};

export default AutoScrollCarousel;
