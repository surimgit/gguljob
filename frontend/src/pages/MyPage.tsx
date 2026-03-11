import { useState } from 'react';
import {
  ProfileHeader,
  ProjectSummary,
  BookmarkedJobs,
  Troubleshooting,
  Portfolio,
  MyProfileModal,
} from '../components/feature/mypage';
import { WithdrawModal, WithdrawCompleteModal } from '../components/feature/auth';

const MOCK_PROFILE = {
  name: '홍길동',
  role: 'FE' as const,
  bio: '안녕하세요, 꿀잡을 이용 중인 홍길동입니다.',
  techStacks: ['React', 'TypeScript', 'Firebase'],
};

const MOCK_MODAL_USER = {
  id: '1',
  name: '홍길동',
  role: 'Frontend',
  bio: '안녕하세요, 꿀잡을 이용 중인 홍길동입니다.',
  techStacks: ['React', 'TypeScript', 'Firebase'],
  projects: [
    {
      id: 'p1',
      name: '꿀잡',
      description: 'IT 취업 준비생을 위한 플랫폼',
      emoji: '🍯',
      bgColor: 'amber' as const,
      myRole: 'Frontend',
      period: '2025.01 - 진행중',
      techStacks: ['React', 'TypeScript'],
    },
    {
      id: 'p2',
      name: '사이드 프로젝트',
      description: '개인 포트폴리오 사이트',
      emoji: '🚀',
      bgColor: 'green' as const,
      myRole: 'Fullstack',
      period: '2024.09 - 2024.12',
      techStacks: ['Next.js', 'Firebase'],
    },
  ],
};

const MyPage = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const handleWithdrawConfirm = () => {
    setIsWithdrawOpen(false);
    setIsCompleteOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProfileHeader
        {...MOCK_PROFILE}
        onAvatarClick={() => setIsProfileModalOpen(true)}
        onEdit={() => {}}
        onWithdraw={() => setIsWithdrawOpen(true)}
      />
      <ProjectSummary />
      <BookmarkedJobs />
      <Troubleshooting />
      <Portfolio />

      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={() => {}}
        user={MOCK_MODAL_USER}
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
