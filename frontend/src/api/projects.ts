import api from './index';
import type {
  Project,
  ProjectDetail,
  ProjectQueryParams,
  ProjectSimple,
  CreateProjectRequest,
  CreateProjectResponse,
  RegisterGitRepoRequest,
  TeamDashboard,
  GitLog,
} from '../types/project';
import type { PageResponse } from '../types/common';

/* ── 기존 (프로젝트 찾기) ── */

export const getProjects = (params?: ProjectQueryParams) =>
  api.get<PageResponse<Project>>('/projects', { params });

export const getProjectById = (id: number) =>
  api.get<ProjectDetail>(`/projects/${id}`);

export const applyToProject = (projectId: number, positionId: number, message: string) =>
  api.post(`/projects/${projectId}/apply`, { positionId, message });

/* ── 내 프로젝트 ── */

export const getMyProjects = () =>
  api.get<ProjectSimple[]>('/v1/projects/me');

export const createProject = (data: CreateProjectRequest) =>
  api.post<CreateProjectResponse>('/v1/projects', data);

/* ── 프로젝트 대시보드 ── */

export const getTeamDashboard = (projectId: number) =>
  api.get<TeamDashboard>(`/v1/projects/${projectId}/team-dashboard`);

export const getGitLog = (projectId: number) =>
  api.get<GitLog>(`/v1/projects/${projectId}/gitlog`);

/* ── 프로젝트 설정 ── */

export const registerGitRepo = (projectId: number, data: RegisterGitRepoRequest) =>
  api.put(`/v1/projects/${projectId}/git-repo`, data);
