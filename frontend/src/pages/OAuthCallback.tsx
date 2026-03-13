import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { getMe } from '../api/user';
import ProfileSetupModal from '../components/feature/auth/ProfileSetupModal';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setTokens, setUser, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const isNewUser = params.get('isNewUser') === 'true';

    if (!accessToken || !refreshToken) {
      navigate('/login', { replace: true });
      return;
    }

    setTokens(accessToken, refreshToken);

    getMe()
      .then((user) => {
        setUser(user);
        setIsLoading(false);
        if (isNewUser) {
          setShowProfileModal(true);
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate('/login', { replace: true });
        } else {
          setError('로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
          setIsLoading(false);
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
            className="text-sm text-primary underline"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">로그인 중...</p>
          </div>
        </div>
      )}
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          navigate('/', { replace: true });
        }}
        onComplete={(_formData) => {
          // TODO: 서버에 프로필 데이터 저장 API 연동
          navigate('/', { replace: true });
        }}
      />
    </>
  );
};

export default OAuthCallback;
