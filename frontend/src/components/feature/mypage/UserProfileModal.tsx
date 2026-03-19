import { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import ProfileModalLayout from './ProfileModalLayout';
import type { ProfileUser, ProfileProject } from './ProfileModalLayout';
import { getUserProfile } from '../../../api/user';
import type { UserProfileDto } from '../../../api/user';

export type UserProfileModalUser = ProfileUser;

const PROJECT_EMOJIS = ['🐝', '🚀', '💡', '🎯'];
const PROJECT_COLORS: ('amber' | 'green' | 'sky' | 'purple')[] = ['amber', 'green', 'sky', 'purple'];

/** API 응답을 ProfileUser로 변환 */
const toProfileUser = (dto: UserProfileDto): ProfileUser => ({
  id: String(dto.userId),
  name: dto.userName,
  role: dto.roles?.[0] ?? '',
  bio: dto.description ?? '',
  avatarUrl: dto.imageUrl || undefined,
  techStacks: (dto.skills ?? []).map(s => s.name),
  projects: (dto.repProjects ?? []).map((p, i): ProfileProject => ({
    id: String(p.projectId),
    name: p.title,
    description: p.description,
    emoji: PROJECT_EMOJIS[i % PROJECT_EMOJIS.length],
    bgColor: PROJECT_COLORS[i % PROJECT_COLORS.length],
    myRole: p.role,
    period: p.period,
    techStacks: p.skills ?? [],
  })),
});

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const UserProfileModal = ({ isOpen, onClose, userId }: UserProfileModalProps) => {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setUser(null);
      setError(null);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getUserProfile(userId);
        setUser(toProfileUser(data.data));
      } catch {
        setError('프로필을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-text-secondary">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center gap-3">
          <p className="text-sm text-text-secondary">{error ?? '프로필을 불러올 수 없습니다.'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-text-primary text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
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
};

export default UserProfileModal;