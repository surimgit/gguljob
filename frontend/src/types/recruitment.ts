// GET /api/v1/jobs, /api/v1/jobs/recommended/top, /api/v1/jobs/bookmarks 응답
export interface JobItem {
  jobId: number;
  companyName: string;
  title: string;
  region: string;
  experience: string;
  contractType: string;
  salary: string;
  url: string;
  deadline: string;
  matchStatus: '최적합' | '적합' | '보통' | '미흡' | '부족';
  matchPercentage: number;
  cutoffHigh: number;
  cutoffMedium: number;
  averageScore: number;
  techStacks: string[];
  jobCategory: string;
  topPercentile?: number;
}

// GET /api/v1/jobs/filters 응답
export interface JobFilters {
  techStacks: string[];
}
