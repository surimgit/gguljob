import type { Job } from '../types/recruitment';

export const mockJobs: Job[] = [
  {
    id: 1,
    title: '프론트엔드 개발자',
    company: '카카오',
    techStacks: ['React', 'TypeScript', 'Next.js'],
    location: '판교',
    experience: '3년 이상',
    deadline: '2026-04-30',
    url: '',
  },
  {
    id: 2,
    title: '백엔드 개발자',
    company: '네이버',
    techStacks: ['Java', 'Spring Boot', 'MySQL'],
    location: '분당',
    experience: '신입',
    deadline: null,
    url: '',
  },
];
