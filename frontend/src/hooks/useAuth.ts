import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getMe } from '../api/user';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, [isAuthenticated, setUser, logout]);

  return { user, isAuthenticated, logout };
};
