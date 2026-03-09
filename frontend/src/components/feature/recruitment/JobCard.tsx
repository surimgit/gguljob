import Card from '../../common/Card';
import Badge from '../../common/Badge';
import type { Job } from '../../../types/recruitment';

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  return (
    <a href={job.url} target="_blank" rel="noopener noreferrer">
      <Card className="hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-cta mb-1">{job.title}</h3>
        <p className="text-accent font-medium text-sm mb-3">{job.company}</p>
        <div className="flex flex-wrap gap-1.5">
          {job.techStacks.map((tech) => (
            <Badge key={tech} label={tech} variant="tech" />
          ))}
        </div>
      </Card>
    </a>
  );
};

export default JobCard;
