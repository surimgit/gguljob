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
