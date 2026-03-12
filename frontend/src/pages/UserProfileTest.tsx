import { useState } from 'react';
import UserProfileModal from '../components/feature/mypage/UserProfileModal';

const MOCK_USER = {
  id: '1',
  name: '김개발',
  role: 'Backend',
  bio: 'Spring Boot와 JPA를 활용한 서버 개발을 좋아합니다.',
  techStacks: ['Java', 'Spring', 'MySQL', 'Redis', 'Docker', 'AWS', 'Kotlin', 'PostgreSQL'],
  projects: [
    {
      id: 'p1',
      name: '꿀잡',
      description: '개발자 구직 매칭 플랫폼',
      emoji: '🐝',
      bgColor: 'amber' as const,
      myRole: 'Backend',
      period: '2025.01 ~ 진행중',
      techStacks: ['Spring', 'MySQL', 'Redis'],
    },
  ],
};

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
      <UserProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} user={MOCK_USER} />
    </div>
  );
};

export default UserProfileTest;
