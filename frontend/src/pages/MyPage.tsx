import { useState } from 'react';
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
import { mockProjects } from '../mocks/projects';

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

const INITIAL_PROFILE: ProfileData = {
  name: '홍길동',
  role: 'FE',
  bio: '안녕하세요, 꿀잡을 이용 중인 홍길동입니다.',
  techStacks: ['React', 'TypeScript', 'Firebase'],
  projects: [
    {
      id: 'p1',
      name: '꿀잡',
      description: 'IT 취업 준비생을 위한 플랫폼',
      emoji: '🍯',
      bgColor: 'amber',
      myRole: 'Frontend',
      period: '2025.01 - 진행중',
      techStacks: ['React', 'TypeScript'],
    },
    {
      id: 'p2',
      name: '사이드 프로젝트',
      description: '개인 포트폴리오 사이트',
      emoji: '🚀',
      bgColor: 'green',
      myRole: 'Fullstack',
      period: '2024.09 - 2024.12',
      techStacks: ['Next.js', 'Firebase'],
    },
  ],
};

const POSITION_LABEL: Record<PositionType, string> = {
  FE: 'Frontend', BE: 'Backend', AI: 'AI', PM: 'PM', INFRA: 'Infra', DESIGN: 'Design',
};

const MyPage = () => {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

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
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProfileHeader
        name={profile.name}
        role={profile.role}
        bio={profile.bio}
        techStacks={profile.techStacks}
        avatarUrl={profile.avatarUrl}
        onAvatarClick={() => setIsProfileModalOpen(true)}
        onEdit={handleOpenEdit}
        onWithdraw={() => setIsWithdrawOpen(true)}
      />
      <ProjectSummary />
      <BookmarkedJobs />
      <Troubleshooting />
      <Portfolio />

      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={handleOpenEdit}
        user={{
          id: '1',
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
        availableProjects={mockProjects}
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
  );
};

export default MyPage;
