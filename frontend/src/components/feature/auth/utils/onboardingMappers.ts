import type { PositionType } from '../../../../types/user';
import type { OnboardingRequest } from '../../../../api/user';

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

const REVERSE_EXPERIENCE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EXPERIENCE_MAP).map(([k, v]) => [v, k])
);

const REVERSE_GOAL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(GOAL_MAP).map(([k, v]) => [v.type, k])
);

export interface OnboardingFormData {
  goals: string[];
  position: string;      // PositionType code (FE, BE, AI, …)
  experience: string;
  skills: string[];       // 기술스택 이름 배열
  mbti: string;
  leaderScore: number;
  workExperience: string;
}

export const userToFormData = (user: {
  position?: string | null;
  experience?: string | null;
  techStacks?: string[];
  mbti?: string | null;
  teamTendency?: string | null;
  goals?: string[];
  workExperience?: string | null;
}): OnboardingFormData => ({
  goals: (user.goals ?? []).map((g) => REVERSE_GOAL_MAP[g] ?? g).filter(Boolean),
  position: user.position ?? '',
  experience: user.experience ? (REVERSE_EXPERIENCE_MAP[user.experience] ?? '') : '',
  skills: user.techStacks ?? [],
  mbti: user.mbti ?? '',
  leaderScore: user.teamTendency === 'LEADER' ? 70 : 30,
  workExperience: user.workExperience ?? '',
});

export const buildOnboardingPayload = (
  formData: OnboardingFormData
): OnboardingRequest | null => {
  const mappedRole = formData.position as PositionType | undefined;
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
    skills: formData.skills,
    mbti: formData.mbti,
    teamTendency: formData.leaderScore > 50 ? 'LEADER' : 'FOLLOWER',
    goals: goalTypes,
    workExperience: (formData.workExperience as OnboardingRequest['workExperience']) || undefined,
  };
};
