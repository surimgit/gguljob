import { UserPlus } from 'lucide-react';
import ProfileModalLayout from './ProfileModalLayout';
import type { ProfileUser } from './ProfileModalLayout';

export type UserProfileModalUser = ProfileUser;

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileModalUser;
}

const UserProfileModal = ({ isOpen, onClose, user }: UserProfileModalProps) => (
  <ProfileModalLayout
    isOpen={isOpen}
    onClose={onClose}
    user={user}
    actionButton={
      <button
        type="button"
        disabled
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-text-primary font-semibold text-sm ml-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UserPlus className="w-4 h-4" />
        팀 초대하기
      </button>
    }
  />
);

export default UserProfileModal;
