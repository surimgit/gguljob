import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { getMe, onboardApi } from '../api/user';
import type { OnboardingRequest } from '../api/user';
import type { PositionType } from '../types/user';
import ProfileSetupModal from '../components/feature/auth/ProfileSetupModal';

const ROLE_MAP: Record<string, PositionType> = {
  frontend: 'FE',
  backend: 'BE',
  designer: 'DESIGN',
  pm: 'PM',
  data: 'AI',
  infra: 'INFRA',
};

const EXPERIENCE_MAP: Record<string, OnboardingRequest['experience']> = {
  beginner: 'BEGINNER',
  junior: 'JUNIOR',
  mid: 'MID_LEVEL',
  senior: 'SENIOR',
};

const GOAL_LABELS: Record<string, string> = {
  'side-project': '사이드 프로젝트',
  portfolio: '포트폴리오',
  study: '스터디',
  startup: '창업 준비',
  competition: '공모전',
  job: '취업 준비',
};

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
          setError('로그인 처리 중 오류 발생했습니다. 잠시 후 다시 시도 해주세요.');
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
          logout();
          navigate('/login', { replace: true });
        }}
        onComplete={async (formData) => {
          try {
            const mappedRole = ROLE_MAP[formData.role];
            const mappedExp = EXPERIENCE_MAP[formData.experience];
            if (!mappedRole || !mappedExp) {
              setError('직무 또는 경험 수준 값이 올바르지 않습니다. 다시 시도해주세요.');
              return;
            }
            const payload: OnboardingRequest = {
              description: formData.goals
                .map((g) => GOAL_LABELS[g] ?? g)
                .join(', ') + '에 관심이 있습니다.',
              roles: [mappedRole],
              experience: mappedExp,
              skills: formData.languages,
              mbti: formData.mbti,
              teamTendency: formData.leaderScore > 50 ? 'LEADER' : 'FOLLOWER',
            };
            await onboardApi(payload);
            const updatedUser = await getMe();
            setUser(updatedUser);
            navigate('/', { replace: true });
          } catch {
            setError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
          }
        }}
      />
    </>
  );
};

export default OAuthCallback;
