import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ProfileHeader,
  ProjectSummary,
  BookmarkedJobs,
  Troubleshooting,
  Portfolio,
  MyProfileModal,
  ProfileEditModal,
} from '../components/feature/mypage';
import { WithdrawModal, WithdrawCompleteModal } from '../components/feature/auth';
import ProfileSetupModal from '../components/feature/auth/ProfileSetupModal';
import { buildOnboardingPayload } from '../components/feature/auth/utils/onboardingMappers';
import type { PositionType } from '../types/user';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { getMe, withdrawApi, updateProfileApi } from '../api/user';

interface Project {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bgColor: 'amber' | 'green' | 'sky' | 'purple';
  myRole: string;
  period: string;
  techStacks: string[];
}

interface ProfileData {
  name: string;
  role: PositionType | null;
  bio: string;
  avatarUrl?: string;
  techStacks: string[];
  projects: Project[];
}

const POSITION_LABEL: Record<PositionType, string> = {
  FE: 'Frontend', BE: 'Backend', AI: 'AI', PM: 'PM', INFRA: 'Infra', DESIGN: 'Design',
};

const MyPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    role: null,
    bio: '',
    techStacks: [],
    projects: [],
  });
  const { myProjects, fetchMyProjects } = useProjectStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  // auth store의 유저 정보로 프로필 초기화
  useEffect(() => {
    if (!user) return;
    setProfile((prev) => ({
      ...prev,
      name: user.name,
      role: user.position ?? user.role ?? null,
      bio: user.description ?? '',
      avatarUrl: user.profileImage ?? undefined,
      techStacks: user.techStacks ?? [],
    }));
  }, [user]);

  // 내 프로젝트 목록 가져오기
  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  const handleWithdrawConfirm = async () => {
    try {
      await withdrawApi();
      logout();
      setIsWithdrawOpen(false);
      setIsCompleteOpen(true);
    } catch {
      setIsWithdrawOpen(false);
      alert('회원 탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleOpenEdit = () => {
    setIsProfileModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSave = (_data: ProfileData) => {
    // API 호출은 ProfileEditModal에서 이미 완료, 여기서는 최신 데이터 반영
    getMe().then((u) => setUser(u)).catch(() => {});
  };

  const handleOnboardingComplete = async (formData: {
    goals: string[];
    role: string;
    experience: string;
    languages: string[];
    mbti: string;
    leaderScore: number;
  }) => {
    try {
      const payload = buildOnboardingPayload(formData);
      if (!payload) {
        alert('직무 또는 경험 수준 값이 올바르지 않습니다.');
        return;
      }
      await updateProfileApi({
        description: payload.description,
        roles: payload.roles,
        skills: payload.skills,
        mbti: payload.mbti,
        teamTendency: payload.teamTendency,
        experience: payload.experience,
        goals: payload.goals,
      });
      const updatedUser = await getMe();
      setUser(updatedUser);
      setIsOnboardingOpen(false);
    } catch (err) {
      console.error('[정보수정] 실패:', err);
      alert('정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] px-4 py-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <ProfileHeader
          name={profile.name}
          role={profile.role}
          bio={profile.bio}
          techStacks={profile.techStacks}
          avatarUrl={profile.avatarUrl}
          onAvatarClick={() => setIsProfileModalOpen(true)}
          onEditInfo={() => setIsOnboardingOpen(true)}
          onWithdraw={() => setIsWithdrawOpen(true)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <ProjectSummary projects={myProjects} />
          <BookmarkedJobs />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Troubleshooting />
          <Portfolio />
        </div>

      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={handleOpenEdit}
        user={{
          id: String(user?.id ?? ''),
          name: profile.name,
          role: profile.role ? POSITION_LABEL[profile.role] : '',
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          techStacks: profile.techStacks,
          projects: profile.projects,
        }}
      />
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setIsProfileModalOpen(true); }}
        onSave={handleSave}
        initialData={profile}
        availableProjects={myProjects}
      />
      <ProfileSetupModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleWithdrawConfirm}
      />
      <WithdrawCompleteModal
        isOpen={isCompleteOpen}
        onClose={() => {
          setIsCompleteOpen(false);
          navigate('/', { replace: true });
        }}
      />
      </div>
    </div>
  );
};

export default MyPage;
