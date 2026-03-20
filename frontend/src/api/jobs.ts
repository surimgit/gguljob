import api from './index';
import type { JobItem, JobFilters } from '../types/recruitment';

export const getRecommendedTop3 = () =>
  api.get<JobItem[]>('/v1/jobs/recommended/top');

export const getJobs = (params?: { page?: number }) =>
  api.get<JobItem[]>('/v1/jobs', { params });

export const getJobFilters = () =>
  api.get<JobFilters>('/v1/jobs/filters');

export const getBookmarkedJobs = () =>
  api.get<JobItem[]>('/v1/jobs/bookmarks');

export const toggleBookmark = (jobId: number) =>
  api.post(`/v1/jobs/${jobId}/bookmarks`);
