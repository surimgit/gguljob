/* ── 프로젝트 찾기 페이지 (GET /projects/list) ── */

export type ProjectDomain =
  | '웹기술' | '웹디자인' | '모바일' | 'AIoT' | '인공지능'
  | '빅데이터' | '블록체인' | '자율주행' | '핀테크' | '메타버스';

export interface ProjectPositionDto {
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
  domain: string;
  leaderName: string;
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
