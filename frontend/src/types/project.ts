/* ── 기존 (프로젝트 찾기 페이지용) ── */

export type ProjectStatus = 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Project {
  id: number;
  title: string;
  description: string;
  techStacks: string[];
  status: ProjectStatus;
  teamSize: number;
  currentMembers: number;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  positions: Position[];
}

export interface ProjectMember {
  userId: number;
  name: string;
  profileImage: string | null;
  role: string;
}

export interface Position {
  id: number;
  title: string;
  description: string;
  isOpen: boolean;
}

export interface ProjectQueryParams {
  page?: number;
  size?: number;
  techStack?: string;
  status?: string;
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
