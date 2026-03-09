import Card from '../../common/Card';
import Badge from '../../common/Badge';
import type { Job } from '../../../types/recruitment';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

const JobCard = ({ job, onClick }: JobCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-[#111827] mb-1">{job.title}</h3>
      <p className="text-amber-500 font-medium text-sm mb-3">{job.company}</p>
      <div className="flex flex-wrap gap-1.5">
        {job.techStacks.map((tech) => (
          <Badge key={tech} label={tech} variant="tech" />
        ))}
      </div>
    </Card>
  );
};

export default JobCard;
