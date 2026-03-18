import type { PositionType } from '../../../../types/user';
import type { OnboardingRequest } from '../../../../api/user';

export const ROLE_MAP: Record<string, PositionType> = {
  frontend: 'FE',
  backend: 'BE',
  designer: 'DESIGN',
  pm: 'PM',
  data: 'AI',
  infra: 'INFRA',
};

export const EXPERIENCE_MAP: Record<string, OnboardingRequest['experience']> = {
  beginner: 'BEGINNER',
  junior: 'JUNIOR',
  mid: 'MID_LEVEL',
  senior: 'SENIOR',
};

export const GOAL_MAP: Record<string, { label: string; type: string }> = {
  'side-project': { label: '사이드 프로젝트', type: 'SIDE_PROJECT' },
  portfolio: { label: '포트폴리오', type: 'PORTFOLIO' },
  study: { label: '스터디', type: 'STUDY' },
  startup: { label: '창업 준비', type: 'STARTUP' },
  competition: { label: '공모전', type: 'COMPETITION' },
  job: { label: '취업 준비', type: 'EMPLOYMENT' },
};

interface OnboardingFormData {
  goals: string[];
  role: string;
  experience: string;
  languages: string[];
  mbti: string;
  leaderScore: number;
}

export const buildOnboardingPayload = (
  formData: OnboardingFormData
): OnboardingRequest | null => {
  const mappedRole = ROLE_MAP[formData.role];
  const mappedExp = EXPERIENCE_MAP[formData.experience];
  if (!mappedRole || !mappedExp) return null;

  const goalsSummary = formData.goals
    .map((g) => GOAL_MAP[g]?.label ?? g)
    .join(', ');
  const goalTypes = formData.goals
    .map((g) => GOAL_MAP[g]?.type)
    .filter((t): t is string => !!t);

  return {
    description: `${goalsSummary}에 관심이 있습니다.`,
    roles: [mappedRole],
    experience: mappedExp,
    skills: formData.languages,
    mbti: formData.mbti,
    teamTendency: formData.leaderScore > 50 ? 'LEADER' : 'FOLLOWER',
    goals: goalTypes,
  };
};
