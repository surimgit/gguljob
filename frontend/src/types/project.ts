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
