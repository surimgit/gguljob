export type PositionType = 'BE' | 'FE' | 'AI' | 'PM' | 'INFRA' | 'DESIGN' | 'DEVOPS' | 'DATA' | 'MOBILE' | 'DB';

export type ExperienceLevel = 'BEGINNER' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';

export interface UserSummary {
  userId: number;
  userName: string;
  description: string | null;
  roles: PositionType[];
  experience: ExperienceLevel | null;
  profileImageUrl: string | null;
}

export interface UserPageResponse {
  content: UserSummary[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface UserSkill {
  name: string;
  category: string;
  iconUrl: string;
}

export interface RepProject {
  projectId: number;
  title: string;
  description: string;
  role: string;
  period: string;
  skills: string[];
  imageUrl?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  description: string | null;
  position: PositionType | null;
  experience: string | null;
  mbti: string | null;
  teamTendency: string | null;
  skills: UserSkill[];
  techStacks: string[];
  goals: string[];
  repProjects: RepProject[];
  workExperience: string | null;
  /** @deprecated position 사용 권장 */
  role: PositionType | null;
}
