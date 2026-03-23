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
    goals: (d.goals ?? []) as string[],
    role: firstRole ?? null,
  };
};

export interface ProfileUpdateRequest {
  description?: string;
  roles: string[];
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

export const deleteProfileImageApi = () =>
  api.delete('/v1/user/me/profile/image');

export const logoutApi = () => api.post('/v1/auth/logout');

export const withdrawApi = () => api.delete('/v1/user/withdraw');

/** GET /v1/user/users → 사용자 전체 목록 조회 (페이지네이션) */
export const getUsers = (params?: { page?: number; size?: number; sort?: string }) =>
  api.get('/v1/user/users', { params });

/** GET /v1/user/{userId} → 타 사용자 프로필 조회 */
export interface UserProfileDto {
  userId: number;
  email: string;
  userName: string;
  imageUrl: string;
  description: string;
  roles: string[];
  experience: string;
  mbti: string;
  teamTendency: string;
  skills: { name: string; category: string; iconUrl: string }[];
  repProjects: {
    projectId: number;
    title: string;
    description: string;
    role: string;
    period: string;
    skills: string[];
  }[];
  goals: string[];
}

export const getUserProfile = (userId: number) =>
  api.get<{ data: UserProfileDto }>(`/v1/user/${userId}`);
