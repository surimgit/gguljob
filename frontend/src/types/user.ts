export type PositionType = 'BE' | 'FE' | 'AI' | 'PM' | 'INFRA' | 'DESIGN';

export interface UserSkill {
  name: string;
  category: string;
  iconUrl: string;
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
  /** @deprecated position 사용 권장 */
  role: PositionType | null;
}
