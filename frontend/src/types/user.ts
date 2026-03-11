export type PositionType = 'BE' | 'FE' | 'AI' | 'PM' | 'INFRA' | 'DESIGN';

export interface User {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  techStacks: string[];
  role: PositionType | null;
}
