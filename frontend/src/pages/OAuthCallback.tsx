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

const GOAL_MAP: Record<string, { label: string; type: string }> = {
  'side-project': { label: '사이드 프로젝트', type: 'SIDE_PROJECT' },
  portfolio: { label: '포트폴리오', type: 'PORTFOLIO' },
  study: { label: '스터디', type: 'STUDY' },
  startup: { label: '창업 준비', type: 'STARTUP' },
  competition: { label: '공모전', type: 'COMPETITION' },
  job: { label: '취업 준비', type: 'EMPLOYMENT' },
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
    if (!accessToken || !refreshToken) {
      navigate('/', { replace: true });
      return;
    }

    setTokens(accessToken, refreshToken);

    getMe()
      .then((user) => {
        setUser(user);
        setIsLoading(false);
        const needsOnboarding = !user.position || !user.experience || !user.mbti;
        if (needsOnboarding) {
          setShowProfileModal(true);
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate('/', { replace: true });
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
            onClick={() => navigate('/', { replace: true })}
            className="text-sm text-primary underline"
          >
            메인으로 돌아가기
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
          navigate('/', { replace: true });
        }}
        onComplete={async (formData) => {
          try {
            const mappedRole = ROLE_MAP[formData.role];
            const mappedExp = EXPERIENCE_MAP[formData.experience];
            if (!mappedRole || !mappedExp) {
              console.error('[온보딩] 매핑 실패 - role:', formData.role, 'experience:', formData.experience);
              setError('직무 또는 경험 수준 값이 올바르지 않습니다. 다시 시도해주세요.');
              return;
            }
            const goalsSummary = formData.goals
              .map((g) => GOAL_MAP[g]?.label ?? g)
              .join(', ');
            const goalTypes = formData.goals
              .map((g) => GOAL_MAP[g]?.type)
              .filter((t): t is string => !!t);
            const payload: OnboardingRequest = {
              description: `${goalsSummary}에 관심이 있습니다.`,
              roles: [mappedRole],
              experience: mappedExp,
              skills: formData.languages,
              mbti: formData.mbti,
              teamTendency: formData.leaderScore > 50 ? 'LEADER' : 'FOLLOWER',
              goals: goalTypes,
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
