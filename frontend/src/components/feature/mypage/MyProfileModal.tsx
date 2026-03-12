import { Settings } from 'lucide-react';
import ProfileModalLayout from './ProfileModalLayout';
import type { ProfileUser } from './ProfileModalLayout';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  user: ProfileUser;
}

const MyProfileModal = ({ isOpen, onClose, onEdit, user }: MyProfileModalProps) => (
  <ProfileModalLayout
    isOpen={isOpen}
    onClose={onClose}
    user={user}
    actionButton={
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-text-primary font-semibold text-sm ml-auto transition-colors"
      >
        <Settings className="w-4 h-4" />
        개인정보 수정
      </button>
    }
  />
);

export default MyProfileModal;
