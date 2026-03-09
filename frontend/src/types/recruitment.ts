export interface Job {
  id: number;
  title: string;
  company: string;
  techStacks: string[];
  location: string;
  experience: string;
  deadline: string | null;
  url: string;
}

export interface JobQueryParams {
  page?: number;
  size?: number;
  techStack?: string;
  experience?: string;
}
