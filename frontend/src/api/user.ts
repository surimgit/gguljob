import api from './index';
import type { User, PositionType } from '../types/user';

export interface OnboardingRequest {
  description: string;
  roles: PositionType[];
  experience: 'BEGINNER' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
  skills: string[];
  mbti: string;
  teamTendency: 'LEADER' | 'FOLLOWER';
}

export const onboardApi = (data: OnboardingRequest) =>
  api.post('/v1/user/onboarding', data);

/** GET /v1/user/me → ApiResponseDto<ProfileResponseDto> 를 User로 매핑 */
export const getMe = async (): Promise<User> => {
  const res = await api.get('/v1/user/me');
  const d = res.data.data;
  return {
    id: d.userId,
    name: d.userName,
    email: d.email,
    profileImage: d.imageUrl ?? null,
    description: d.description ?? null,
    position: (d.position as PositionType) ?? null,
    experience: d.experience ?? null,
    mbti: d.mbti ?? null,
    teamTendency: d.teamTendency ?? null,
    skills: d.skills ?? [],
    techStacks: (d.skills ?? []).map((s: { name: string }) => s.name),
    role: (d.position as PositionType) ?? null,
  };
};

export const updateProfile = (data: Partial<Pick<User, 'name' | 'techStacks'>>) =>
  api.patch<User>('/v1/user/me', data);

export const logoutApi = () => api.post('/v1/auth/logout');

export const withdrawApi = () => api.delete('/v1/user/me');
