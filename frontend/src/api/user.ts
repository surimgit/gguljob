import api from './index';
import type { User } from '../types/user';

export const getMe = () => api.get<User>('/v1/user/me');

export const updateProfile = (data: Partial<Pick<User, 'name' | 'techStacks'>>) =>
  api.patch<User>('/v1/user/me', data);

export const logoutApi = () => api.post('/v1/auth/logout');

export const withdrawApi = () => api.delete('/v1/user/me');
