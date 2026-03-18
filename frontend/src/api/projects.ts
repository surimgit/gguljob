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
  TeamManagement,
  GitLog,
  MembersDetail,
} from '../types/project';
import type { PageResponse } from '../types/common';

/* ── 기존 (프로젝트 찾기) ── */

export const getProjects = (params?: ProjectQueryParams) =>
  api.get<PageResponse<Project>>('/projects', { params });

export const getProjectById = (id: number) =>
  api.get<ProjectDetail>(`/projects/${id}`);

export const inviteUser = (projectId: number, userId: number) =>
  api.post(`/v1/projects/${projectId}/invites/${userId}`);

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

/* ── 팀원 관리 (모집/멤버/신청 현황) ── */

export const getTeamManagement = (projectId: number) =>
  api.get<{ data: TeamManagement }>(`/v1/projects/${projectId}/members/detail`);

export const getMembersDetail = (projectId: number) =>
  api.get<{ data: MembersDetail }>(`/v1/projects/${projectId}/members/detail`);

/* ── 합류 요청 ── */

export const applyToPosition = (projectId: number, positionId: number, appealContent?: string) =>
  api.post(`/v1/projects/${projectId}/positions/${positionId}/apply`, appealContent ? { appealContent } : undefined);

/* ── 프로젝트 설정 ── */

export const registerGitRepo = (projectId: number, data: RegisterGitRepoRequest) =>
  api.put(`/v1/projects/${projectId}/git-repo`, data);

/* ── 프로젝트 참여 수락/거절 ── */

export const acceptRequest = (requestId: number) =>
  api.post(`/v1/requests/${requestId}/accept`);

export const rejectRequest = (requestId: number) =>
  api.post(`/v1/requests/${requestId}/reject`);
