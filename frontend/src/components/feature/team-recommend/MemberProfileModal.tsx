import { Mail } from 'lucide-react';
import ProfileModalLayout from '../mypage/ProfileModalLayout';
import type { ProfileUser } from '../mypage/ProfileModalLayout';

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser;
}

const MemberProfileModal = ({ isOpen, onClose, user }: MemberProfileModalProps) => (
  <ProfileModalLayout
    isOpen={isOpen}
    onClose={onClose}
    user={user}
    actionButton={
      <button
        type="button"
        onClick={() => {
          // TODO: 팀 초대 모달 연결
        }}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-text-primary font-semibold text-sm ml-auto transition-colors"
      >
        <Mail className="w-4 h-4" />
        팀 초대하기
      </button>
    }
  />
);

export default MemberProfileModal;
