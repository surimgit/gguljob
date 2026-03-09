import api from './index';
import type { Project, ProjectDetail, ProjectQueryParams } from '../types/project';
import type { PageResponse } from '../types/common';

export const getProjects = (params?: ProjectQueryParams) =>
  api.get<PageResponse<Project>>('/projects', { params });

export const getProjectById = (id: number) =>
  api.get<ProjectDetail>(`/projects/${id}`);

export const applyToProject = (projectId: number, positionId: number, message: string) =>
  api.post(`/projects/${projectId}/apply`, { positionId, message });
