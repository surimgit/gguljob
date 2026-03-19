import api from './index';
import type {
  ProjectCardDto,
  ProjectListParams,
  ProjectSimple,
  CreateProjectRequest,
  CreateProjectResponse,
  RegisterGitRepoRequest,
  TeamDashboard,
  GitLog,
} from '../types/project';
import type { PageResponse } from '../types/common';

/* ── 프로젝트 찾기 ── */

export const getProjects = (params?: ProjectListParams) =>
  api.get<PageResponse<ProjectCardDto>>('/v1/projects/list', { params });

export const getRecommendedProjects = () =>
  api.get<ProjectCardDto[]>('/v1/projects/recommended/top');

export interface FilterOption {
  value: string;
  label: string;
}

export interface SkillCategory {
  category: string;
  skills: { skillId: number; name: string }[];
}

export interface ProjectFiltersRaw {
  domains: FilterOption[];
  roles: FilterOption[];
  skillCategories: SkillCategory[];
}

export interface SkillGroup {
  category: string;
  label: string;
  skills: string[];
}

export interface ProjectFilters {
  domains: string[];
  skillGroups: SkillGroup[];
  roles: string[];
  /** label → API value 매핑 (도메인: "웹기술" → "WEB_TECH", 포지션: "FE 모집중" → "FRONTEND") */
  domainValueMap: Record<string, string>;
  roleValueMap: Record<string, string>;
}

export const getProjectFilters = () =>
  api.get<ProjectFiltersRaw>('/v1/projects/filters');

export const applyToPosition = (projectId: number, positionId: number, appealContent?: string) =>
  api.post(`/v1/projects/${projectId}/positions/${positionId}/apply`, appealContent ? { appealContent } : undefined);

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
