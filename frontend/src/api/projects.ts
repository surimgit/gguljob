import api from './index';
import type {
  Project,
  ProjectDetail,
  ProjectQueryParams,
  ProjectSimple,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectEditForm,
  ProjectUpdateRequest,
  ProjectUpdateResponse,
  RegisterGitRepoRequest,
  TeamDashboard,
  TeamManagement,
  GitLog,
} from '../types/project';
import type { PageResponse } from '../types/common';

/* ── 기존 (프로젝트 찾기) ── */

export const getProjects = (params?: ProjectQueryParams) =>
  api.get<PageResponse<Project>>('/v1/projects/list', { params });

export const getProjectById = (id: number) =>
  api.get<ProjectDetail>(`/projects/${id}`);

export const inviteUser = (projectId: number, userId: number, body: { role: string; appealContent?: string }) =>
  api.post(`/v1/projects/${projectId}/invites/${userId}`, body);

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

/* ── 합류 요청 ── */

export const applyToPosition = (projectId: number, positionId: number, appealContent?: string) =>
  api.post(`/v1/projects/${projectId}/positions/${positionId}/apply`, appealContent ? { appealContent } : undefined);

/* ── 프로젝트 설정 ── */

export const getProjectEditForm = (projectId: number) =>
  api.get<{ data: ProjectEditForm }>(`/v1/projects/${projectId}/edit`);

export const updateProject = (projectId: number, data: ProjectUpdateRequest) =>
  api.patch<{ data: ProjectUpdateResponse }>(`/v1/projects/${projectId}`, data);

export const registerGitRepo = (projectId: number, data: RegisterGitRepoRequest) =>
  api.put(`/v1/projects/${projectId}/git-repo`, data);

/* ── 모집 공고 ── */

export const createRecruitment = (projectId: number, body: { role: string; targetCount: number; requireSkills: string[] }) =>
  api.post(`/v1/projects/${projectId}/recruitments`, body);

export const updateRecruitmentStatus = (projectId: number, positionId: number, status: string) =>
  api.patch(`/v1/projects/${projectId}/recruitments/${positionId}/status`, { status });

export const updateRecruitmentTargetCount = (projectId: number, positionId: number, targetCount: number) =>
  api.patch(`/v1/projects/${projectId}/recruitments/${positionId}/target-count`, { targetCount });

/* ── 프로젝트 참여 수락/거절 ── */

export const acceptRequest = (requestId: number) =>
  api.post(`/v1/projects/requests/${requestId}/accept`);

export const rejectRequest = (requestId: number) =>
  api.post(`/v1/projects/requests/${requestId}/reject`);

/* ── 팀원 내보내기 / 팀 나가기 ── */

export const removeMember = (projectId: number, memberId: number) =>
  api.delete(`/v1/projects/${projectId}/members/${memberId}`);

export const leaveProject = (projectId: number) =>
  api.delete(`/v1/projects/${projectId}/members/leave`);

/* 나만의 공간 */

export const getPersonalSpace = (projectId: number) =>
  api.get(`/v1/projects/${projectId}/personal-space`);

export interface PullRequestListItem {
  prId: number;
  prNumber: number;
  title: string;
  status: string;
  githubCreatedAt: string;
  githubClosedAt: string | null;
}

export interface PullRequestPage {
  content: PullRequestListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const getPullRequests = (projectId: number, page = 0, size = 10) =>
  api.get<PullRequestPage>(`/v1/projects/${projectId}/personal-space/pull-requests`, {
    params: { page, size },
  });

/* AI 주제 추천 */

export const recommendTopics = (projectId: number, isRefresh: boolean, keyword?: string) =>
  api.post<{ projectId: number; domain: string; recommendedTopics: string[] }>(`/v1/ai/projects/${projectId}/topics/recommend`, { isRefresh, keyword }, { timeout: 60000 });

/* AI 추천 주제 적용 */

export const updateProjectTitle = (projectId: number, selectedTopic: string) =>
  api.patch(`/v1/projects/${projectId}/title`, { selectedTopic });

/* 추천 팀원 */

export interface RecommendedMember {
  userId: number;
  userName: string;
  position: string;
  experienceLevel: string;
  bio: string;
  skills: string[];
  matchScore: number;
}

export interface RecommendedMembersParams {
  keyword?: string;
  position?: string;
  experienceLevel?: string;
  page?: number;
  size?: number;
}

export const getRecommendedMembersTop = (projectId: number) =>
  api.get<RecommendedMember[]>(`/v1/projects/${projectId}/recommended-members/top`);

export const getRecommendedMembers = (projectId: number, params?: RecommendedMembersParams) =>
  api.get(`/v1/projects/${projectId}/recommended-members`, { params: { ...params, page: params?.page ?? 0, size: params?.size ?? 6 } });
