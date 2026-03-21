import { useQuery } from '@tanstack/react-query';
import { getProjects, getRecommendedProjects, getProjectFilters } from '../api/projects';
import type { ProjectFilters, SkillGroup } from '../api/projects';
import type { ProjectCardDto, ProjectListParams } from '../types/project';
import type { PageResponse } from '../types/common';
import { SKILLS_BY_CATEGORY, ROLE_LIST } from '../constants/skills';

/** 객체에서 문자열 값을 추출 (name, skillName, domainName, label, value, title 순으로 탐색) */
const extractString = (obj: unknown): string => {
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object' || obj === null) return String(obj);
  const record = obj as Record<string, unknown>;
  // 일반적인 필드명 우선 탐색
  for (const key of ['name', 'skillName', 'domainName', 'label', 'value', 'title']) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  // 그래도 없으면 첫 번째 문자열 값 사용
  for (const val of Object.values(record)) {
    if (typeof val === 'string') return val;
  }
  console.warn('[useProjects] 문자열 변환 실패:', JSON.stringify(obj));
  return String(obj);
};

/** 배열 아이템이 문자열이 아닌 경우 문자열로 변환 */
const toStringArray = (arr: unknown): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(extractString);
};

/** API 응답의 skills 필드가 객체 배열일 수 있으므로 문자열로 정규화 */
const normalizeProject = (p: ProjectCardDto): ProjectCardDto => ({
  ...p,
  skills: toStringArray(p.skills),
});

export const useProjects = (params?: ProjectListParams) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async (): Promise<PageResponse<ProjectCardDto>> => {
      const res = await getProjects(params);
      const body = res.data as any;
      // ApiResponseDto 래핑 대응
      const page = body?.data ?? body;
      return {
        ...page,
        content: (page.content ?? []).map(normalizeProject),
      };
    },
    placeholderData: (prev) => prev,
  });
};

export const useRecommendedProjects = () => {
  return useQuery({
    queryKey: ['projects', 'recommended'],
    queryFn: async (): Promise<ProjectCardDto[]> => {
      const res = await getRecommendedProjects();
      const body = res.data as any;
      const list = Array.isArray(body) ? body : (body?.data ?? []);
      return (list as ProjectCardDto[]).map(normalizeProject);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectFilters = () => {
  return useQuery({
    queryKey: ['projects', 'filters'],
    queryFn: async (): Promise<ProjectFilters> => {
      const res = await getProjectFilters();
      const body = res.data as any;
      const raw = body?.data ?? body;

      // domains: [{value, label}] → label 배열
      const domains = (raw?.domains ?? []).map((d: any) => d?.label ?? d?.value ?? String(d));

      // skillCategories: [{category, skills: [{skillId, name}]}] → 카테고리별 그룹
      const CATEGORY_LABELS: Record<string, string> = {
        FRONTEND: 'Frontend',
        BACKEND: 'Backend',
        MOBILE: 'Mobile',
        DEVOPS: 'DevOps',
        DATABASE: 'Database',
        DATA: 'Data',
        AI: 'AI',
        PM: 'PM',
        TOOLS: 'Tools',
      };
      const rawSkillGroups: SkillGroup[] = (raw?.skillCategories ?? []).map((cat: any) => ({
        category: cat.category,
        label: CATEGORY_LABELS[cat.category] ?? cat.category,
        skills: (cat?.skills ?? []).map((s: any) => s?.name ?? String(s)),
      }));

      // API에서 skillCategories가 비어있으면 constants/skills.ts 폴백
      const unsorted: SkillGroup[] = rawSkillGroups.length > 0
        ? rawSkillGroups
        : Object.entries(SKILLS_BY_CATEGORY).map(([category, skills]) => ({
            category,
            label: CATEGORY_LABELS[category] ?? category,
            skills,
          }));

      // skills.ts ROLE_LIST 순서대로 정렬
      const skillGroups = [...unsorted].sort((a, b) => {
        const idxA = ROLE_LIST.indexOf(a.category as any);
        const idxB = ROLE_LIST.indexOf(b.category as any);
        return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB);
      });

      // roles: [{value, label}] → label 배열
      const roles = (raw?.roles ?? []).map((r: any) => r?.label ?? r?.value ?? String(r));

      // label → value 매핑 (API 요청 시 value로 변환 필요)
      const domainValueMap: Record<string, string> = {};
      for (const d of (raw?.domains ?? [])) {
        domainValueMap[d.label ?? d.value] = d.value;
      }
      const roleValueMap: Record<string, string> = {};
      for (const r of (raw?.roles ?? [])) {
        roleValueMap[r.label ?? r.value] = r.value;
      }

      return { domains, skillGroups, roles, domainValueMap, roleValueMap };
    },
    staleTime: 10 * 60 * 1000,
  });
};
