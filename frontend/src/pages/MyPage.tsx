import { useState } from 'react';
import {
  ProfileHeader,
  ProjectSummary,
  BookmarkedJobs,
  Troubleshooting,
  Portfolio,
} from '../components/feature/mypage';
import { WithdrawModal, WithdrawCompleteModal } from '../components/feature/auth';

const MOCK_PROFILE = {
  name: '홍길동',
  role: '프론트엔드',
  bio: '안녕하세요, 꿀잡을 이용 중인 홍길동입니다.',
  techStacks: ['React', 'TypeScript', 'Firebase'],
};

const MyPage = () => {
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
        onEdit={() => {}}
        onWithdraw={() => setIsWithdrawOpen(true)}
      />
      <ProjectSummary />
      <BookmarkedJobs />
      <Troubleshooting />
      <Portfolio />

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
