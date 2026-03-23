/* ── 프로젝트 찾기 페이지 (GET /projects/list) ── */

export type ProjectDomain =
  | '웹기술' | '웹디자인' | '모바일' | 'AIoT' | '인공지능'
  | '빅데이터' | '블록체인' | '자율주행' | '핀테크' | '메타버스';

export interface ProjectPositionDto {
  positionId: number;
  role: string;
  currentCount: number;
  targetCount: number;
}

export interface ProjectCardDto {
  projectId: number;
  domain: ProjectDomain;
  status: BackendProjectStatus;
  title: string;
  description: string;
  skills: string[];
  positions: ProjectPositionDto[];
  leaderName: string;
  leaderProfileImageUrl: string | null;
  score: number;
}

export interface ProjectListParams {
  page?: number;
  size?: number;
  keyword?: string;
  domain?: string;
  skill?: string;
  position?: string;
  sort?: string;
  excludeTop?: boolean;
}

/* ── 백엔드 API 연동 타입 ── */

export type BackendProjectStatus = 'RECRUITING' | 'PROCEEDING' | 'DONE';

// GET /projects/me 응답
export interface ProjectSimple {
  projectId: number;
  title: string;
  teamName: string;
  description: string | null;
  domain: string;
  leaderName: string;
  leaderProfileImageUrl: string | null;
  status: BackendProjectStatus;
  finishedAt: string | null;
  imageUrl: string | null;
  roleCounts: Record<string, number>;
  skills: string[];
}

// POST /projects 요청
export interface CreateProjectRequest {
  title: string;
  teamName?: string;
  domain?: string;
  description?: string;
  isPublic?: boolean;
  imageUrl?: string;
  documentUrl?: string;
  leaderRole: string;
}

// POST /projects 응답
export interface CreateProjectResponse {
  projectId: number;
}

// GET /projects/{id}/edit 응답
export type BackendProjectEditStatus = 'RECRUITING' | 'PROCEEDING' | 'DONE' | 'STOPPED';

export interface ProjectEditMember {
  userId: number;
  userName: string;
  role: string;
}

export interface ProjectEditForm {
  status: BackendProjectEditStatus;
  title: string;
  teamName: string;
  description: string;
  domain: string;
  skillIds: number[];
  members: ProjectEditMember[];
}

// PATCH /projects/{id} 요청
export interface ProjectUpdateRequest {
  status: string;
  title: string;
  teamName?: string;
  description?: string;
  domain?: string;
  skillIds: number[];
  members: { userId: number; role: string }[];
}

// PATCH /projects/{id} 응답
export interface ProjectUpdateResponse {
  projectId: number;
  teamName: string;
  title: string;
  status: string;
}

// PUT /projects/{id}/git-repo 요청
export interface RegisterGitRepoRequest {
  repoUrl: string;
  githubToken?: string;
}

// GET /projects/{id}/team-dashboard 응답
export interface TeamDashboard {
  projectInfo: {
    title: string;
    teamName: string;
    topic?: string;
    domain: string;
    description: string;
    skills: string[];
  };
  teamStats: {
    totalMembers: number;
    roleCounts: Record<string, number>;
    totalCommits: number;
    totalTroubleshootings: number;
  };
  gitRepoInfo: {
    repoUrl: string;
    lastSyncTime: string;
  } | null;
}

// GET /projects/{id}/members/detail 응답
export type PositionType = 'FE' | 'BE' | 'AI' | 'PM' | 'INFRA' | 'DESIGN';
export type PositionStatus = 'RECRUITING' | 'DONE';

export interface RecruitmentStatus {
  positionId: number;
  role: PositionType;
  status: PositionStatus;
  currentCount: number;
  targetCount: number;
  requireSkills: string[];
}

export interface CurrentMember {
  memberId: number;
  userId: number;
  role: PositionType;
  userName: string;
  profileImageUrl: string | null;
  joinedAt: string;
}

export interface PendingJoinRequest {
  requestId: number;
  userId: number;
  userName: string;
  userProfileImageUrl: string | null;
  positionName: string;
  techStacks: string[];
  createdAt: string;
}

export interface TeamManagement {
  recruitments: RecruitmentStatus[];
  currentMembers: CurrentMember[];
  pendingRequests: PendingJoinRequest[];
}

// GET /projects/{id}/gitlog 응답
export interface GitLog {
  mrRankings: MrRanking[];
  recentActivities: ActivityLog[];
}

export interface MrRanking {
  rank: number;
  userId: number;
  userName: string;
  profileImageUrl: string | null;
  mrCount: number;
}

export interface ActivityLog {
  userName: string;
  profileImageUrl: string | null;
  content: string;
  label: string;
  createdAt: string;
  activityType: string;
}

/* ── 나만의 공간 ── */

export interface PersonalSpaceData {
  stats: {
    prCount: number;
    reviewCount: number;
    troubleshootingCount: number;
  };
  myPullRequests: {
    prId: number;
    prNumber: number;
    title: string;
    status: string;
    githubCreatedAt: string;
    githubClosedAt: string | null;
  }[];
  myReviews: {
    reviewId: number;
    contentSnippet: string;
    createdAt: string;
  }[];
  myTroubleshootings: {
    tsId: number;
    title: string;
    situation: string;
    createdAt: string;
  }[];
}
