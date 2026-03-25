import api from './index';

export interface SkillDto {
  id: number;
  name: string;
  category: string;
  iconUrl: string;
}

export interface SkillListByCategory {
  categories: Record<string, SkillDto[]>;
}

/** GET /v1/skills → 기술 스택 전체 목록 (카테고리별 그룹) */
export const getSkills = async (): Promise<SkillListByCategory> => {
  const res = await api.get('/v1/skills');
  return res.data.data;
};
