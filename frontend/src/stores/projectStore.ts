import { create } from 'zustand';
import type {
  ProjectSimple,
  TeamDashboard,
  GitLog,
  CreateProjectRequest,
} from '../types/project';
import {
  getMyProjects,
  createProject as createProjectApi,
  getTeamDashboard,
  getGitLog,
  registerGitRepo as registerGitRepoApi,
} from '../api/projects';

interface ProjectState {
  // 내 프로젝트 목록
  myProjects: ProjectSimple[];
  myProjectsLoading: boolean;
  fetchMyProjects: () => Promise<void>;

  // 프로젝트 생성
  createProject: (data: CreateProjectRequest) => Promise<number>;

  // 대시보드
  dashboard: TeamDashboard | null;
  gitLog: GitLog | null;
  dashboardLoading: boolean;
  fetchDashboard: (projectId: number) => Promise<void>;

  // Git 레포 등록
  registerGitRepo: (projectId: number, repoUrl: string, githubToken?: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  myProjects: [],
  myProjectsLoading: false,
  fetchMyProjects: async () => {
    set({ myProjectsLoading: true });
    try {
      const { data } = await getMyProjects();
      set({ myProjects: data });
    } finally {
      set({ myProjectsLoading: false });
    }
  },

  createProject: async (data) => {
    const { data: res } = await createProjectApi(data);
    return res.projectId;
  },

  dashboard: null,
  gitLog: null,
  dashboardLoading: false,
  fetchDashboard: async (projectId) => {
    set({ dashboardLoading: true, dashboard: null, gitLog: null });
    try {
      const [dashRes, logRes] = await Promise.all([
        getTeamDashboard(projectId),
        getGitLog(projectId),
      ]);
      set({ dashboard: dashRes.data, gitLog: logRes.data });
    } finally {
      set({ dashboardLoading: false });
    }
  },

  registerGitRepo: async (projectId, repoUrl, githubToken) => {
    await registerGitRepoApi(projectId, { repoUrl, githubToken });
  },
}));
