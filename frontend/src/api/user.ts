import api from './index';
import type { User } from '../types/user';

export const getMe = () => api.get<User>('/users/me');

export const updateProfile = (data: Partial<Pick<User, 'name' | 'techStacks'>>) =>
  api.patch<User>('/users/me', data);
