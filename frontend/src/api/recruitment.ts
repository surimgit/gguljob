import api from './index';
import type { Job } from '../types/recruitment';
import type { PageResponse } from '../types/common';

export const getJobs = (params?: {
  page?: number;
  size?: number;
  techStack?: string;
  experience?: string;
}) => api.get<PageResponse<Job>>('/recruitment', { params });

export const getJobById = (id: number) =>
  api.get<Job>(`/recruitment/${id}`);
