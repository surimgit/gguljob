import api from './index';
import type { Job, JobQueryParams } from '../types/recruitment';
import type { PageResponse } from '../types/common';

export const getJobs = (params?: JobQueryParams) =>
  api.get<PageResponse<Job>>('/recruitment', { params });

export const getJobById = (id: number) =>
  api.get<Job>(`/recruitment/${id}`);
