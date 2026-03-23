import { useState } from 'react';
import UserProfileModal from '../components/feature/mypage/UserProfileModal';

const UserProfileTest = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-text-primary font-semibold transition-colors"
      >
        프로필 모달 열기
      </button>
      <UserProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} userId={1} />
    </div>
  );
};

export default UserProfileTest;