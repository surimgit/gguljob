import { create } from 'zustand';
import type { Project } from '../types/project';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),
}));
