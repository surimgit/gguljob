import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { getMe } from '../api/user';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setTokens, setUser, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

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
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate('/login', { replace: true });
        } else {
          setError('로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-gray-700 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-sm text-accent underline"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
