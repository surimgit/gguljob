import api from './index';
import type { JobItem, JobFilters } from '../types/recruitment';

export interface BookmarkItem {
  jobId: number;
  companyName: string;
  title: string;
  region: string;
  experience: string;
  contractType: string;
  salary: string;
  url: string | null;
  deadline: string | null;
  jobCategory: string | null;
  techStacks: string[];
  logoUrl: string;
}

interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export const getRecommendedTop3 = () =>
  api.get<JobItem[]>('/v1/jobs/recommended/top');

export const getJobs = (params?: { page?: number; size?: number }) =>
  api.get<{ content: JobItem[]; totalPages: number; totalElements: number; currentPage: number; size: number }>('/v1/jobs', { params });

export const getAllJobs = () =>
  api.get<JobItem[]>('/v1/jobs/all', { timeout: 60000 });

export const getJobFilters = () =>
  api.get<JobFilters>('/v1/jobs/filters');

export const getBookmarkedJobs = () =>
  api.get<ApiResponse<PagedResponse<BookmarkItem>>>('/v1/jobs/bookmarks');

export const toggleBookmark = (jobId: number) =>
  api.post(`/v1/jobs/${jobId}/bookmarks`);
