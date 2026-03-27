import api from './index';
import type {
  ProjectCardDto,
  ProjectListParams,
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
  /** 스킬 이름 → 스킬 ID 매핑 ("React" → 1) */
  skillNameToIdMap: Record<string, number>;
}

export const getProjectFilters = () =>
  api.get<ProjectFiltersRaw>('/v1/projects/filters');

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
  api.get<ProjectEditForm>(`/v1/projects/${projectId}/edit`);

export const updateProject = (projectId: number, data: ProjectUpdateRequest) =>
  api.patch<{ data: ProjectUpdateResponse }>(`/v1/projects/${projectId}`, data);

export const uploadProjectImage = (projectId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.patch<{ data: string }>(`/v1/projects/${projectId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteProject = (projectId: number) =>
  api.delete(`/v1/projects/${projectId}`);

export const deleteProjectImage = (projectId: number) =>
  api.delete(`/v1/projects/${projectId}/image`);

export const registerGitRepo = (projectId: number, data: RegisterGitRepoRequest) =>
  api.put(`/v1/projects/${projectId}/git-repo`, data);

export const disconnectGitRepo = (projectId: number) =>
  api.delete(`/v1/projects/${projectId}/git-repo`);

/* ── 모집 공고 ── */

export const createRecruitment = (projectId: number, body: { role: string; targetCount: number; requireSkills: string[] }) =>
  api.post(`/v1/projects/${projectId}/recruitments`, body);

export const deleteRecruitment = (projectId: number, recruitmentId: number) =>
  api.delete(`/v1/projects/${projectId}/recruitments/${recruitmentId}`);

export const updateRecruitmentStatus = (projectId: number, recruitmentId: number, status: string) =>
  api.patch(`/v1/projects/${projectId}/recruitments/${recruitmentId}/status`, { status });

export const updateRecruitmentTargetCount = (projectId: number, recruitmentId: number, targetCount: number) =>
  api.patch(`/v1/projects/${projectId}/recruitments/${recruitmentId}/target-count`, { targetCount });

/* ── 프로젝트 참여 수락/거절 ── */

export const acceptRequest = (requestId: number) =>
  api.post(`/v1/projects/requests/${requestId}/accept`);

export const rejectRequest = (requestId: number) =>
  api.post(`/v1/projects/requests/${requestId}/reject`);

export const cancelRequest = (requestId: number) =>
  api.delete(`/v1/projects/requests/${requestId}/cancel`);

/* ── 팀원 목록 (일반) ── */

export const getProjectMembers = (projectId: number) =>
  api.get<{ data: { memberId: number; userId: number; role: string; userName: string; profileImageUrl: string | null }[] }>(`/v1/projects/${projectId}/members`);

/* ── 팀원 내보내기 / 팀 나가기 ── */

export const removeMember = (projectId: number, memberId: number) =>
  api.delete(`/v1/projects/${projectId}/members/${memberId}`);

export const leaveProject = (projectId: number) =>
  api.delete(`/v1/projects/${projectId}/members/leave`);

/* 팀장 위임 */

export const delegateLeader = (projectId: number, targetUserId: number) =>
  api.patch(`/v1/projects/${projectId}/members/${targetUserId}/delegate`);

/* 나만의 공간 */

export const getPersonalSpace = (projectId: number) =>
  api.get(`/v1/projects/${projectId}/personal-space`);

export interface PullRequestListItem {
  prId: number;
  prNumber: number;
  title: string;
  status: string;
  diff_url: string | null;
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

/* 프로젝트 명 수정 */

export const updateProjectTitle = (projectId: number, title: string) =>
  api.patch(`/v1/projects/${projectId}/title`, { title });

/* AI 추천 주제 적용 */

export const updateProjectTopic = (projectId: number, selectedTopic: string) =>
  api.patch(`/v1/projects/${projectId}/topic`, { selectedTopic });

/* 추천 팀원 */

export interface RecommendedMember {
  userId: number;
  userName: string;
  profileImageUrl: string | null;
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
  api.get<RecommendedMember[]>(`/v1/projects/${projectId}/recommended-members/top`, { timeout: 60000 });

export const getRecommendedMembers = (projectId: number, params?: RecommendedMembersParams) =>
  api.get(`/v1/projects/${projectId}/recommended-members`, { params: { ...params, page: params?.page ?? 0, size: params?.size ?? 6 }, timeout: 60000 });

/* ── GitHub 기여자 중 비멤버 ── */

export interface GitHubContributor {
  userId: number;
  userName: string;
  profileImageUrl: string | null;
  prCount: number;
}

export const getGitHubContributors = (projectId: number) =>
  api.get<{ data: GitHubContributor[] }>(`/v1/projects/${projectId}/github-contributors`);
