import Card from '../../common/Card';
import type { User } from '../../../types/user';

interface ProfileCardProps {
  user: User;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <Card className="flex items-center gap-4">
      <img
        src={user.profileImage ?? '/default-avatar.png'}
        alt={user.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div>
        <p className="text-lg font-semibold text-[#111827]">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    </Card>
  );
};

export default ProfileCard;
