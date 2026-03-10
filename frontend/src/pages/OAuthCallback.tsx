import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getMe } from '../api/user';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setTokens, setUser, logout } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login', { replace: true });
      return;
    }

    setTokens(accessToken, refreshToken);

    getMe()
      .then((res) => {
        setUser(res.data);
        navigate('/', { replace: true });
      })
      .catch(() => {
        logout();
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">로그인 중...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
