import { useState, useEffect } from 'react';
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
import type { PositionType } from '../types/user';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { getMe } from '../api/user';

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
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

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

  const handleWithdrawConfirm = () => {
    setIsWithdrawOpen(false);
    setIsCompleteOpen(true);
  };

  const handleOpenEdit = () => {
    setIsProfileModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSave = (data: ProfileData) => {
    setProfile(data);
    // 저장 후 최신 사용자 정보 다시 가져오기
    getMe().then((u) => setUser(u)).catch(() => {});
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
          onWithdraw={() => setIsWithdrawOpen(true)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <ProjectSummary projects={myProjects} />
          <BookmarkedJobs />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleWithdrawConfirm}
      />
      <WithdrawCompleteModal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
      />
      </div>
    </div>
  );
};

export default MyPage;
