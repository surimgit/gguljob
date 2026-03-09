import Card from '../../common/Card';
import Badge from '../../common/Badge';
import type { Project } from '../../../types/project';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-[#111827] mb-2">{project.title}</h3>
      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.techStacks.map((tech) => (
          <Badge key={tech} label={tech} variant="tech" />
        ))}
      </div>
    </Card>
  );
};

export default ProjectCard;
