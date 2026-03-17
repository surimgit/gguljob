import api from './index';
import type { User, PositionType } from '../types/user';

export interface OnboardingRequest {
  description: string;
  roles: PositionType[];
  experience: 'BEGINNER' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
  skills: string[];
  mbti: string;
  teamTendency: 'LEADER' | 'FOLLOWER';
  goals: string[];
}

export const onboardApi = (data: OnboardingRequest) =>
  api.post('/v1/user/onboarding', data);

/** GET /v1/user/me → ApiResponseDto<ProfileResponseDto> 를 User로 매핑 */
export const getMe = async (): Promise<User> => {
  const res = await api.get('/v1/user/me');
  const d = res.data.data;
  const firstRole = d.roles?.[0] as PositionType | undefined;
  return {
    id: d.userId,
    name: d.userName,
    email: d.email,
    profileImage: d.imageUrl ?? null,
    description: d.description ?? null,
    position: firstRole ?? null,
    experience: d.experience ?? null,
    mbti: d.mbti ?? null,
    teamTendency: d.teamTendency ?? null,
    skills: d.skills ?? [],
    techStacks: (d.skills ?? []).map((s: { name: string }) => s.name),
    role: firstRole ?? null,
  };
};

export interface ProfileUpdateRequest {
  description?: string;
  roles: PositionType[];
  mbti?: string;
  teamTendency?: string;
  experience?: string;
  skills?: string[];
  goals?: string[];
}

export const updateProfileApi = (data: ProfileUpdateRequest) =>
  api.patch('/v1/user/me/profile', data);

export const uploadProfileImageApi = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.patch<{ data: string }>('/v1/user/me/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const logoutApi = () => api.post('/v1/auth/logout');

export const withdrawApi = () => api.delete('/v1/user/withdraw');
