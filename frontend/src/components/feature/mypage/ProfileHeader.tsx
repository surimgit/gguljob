import { Settings, UserX } from 'lucide-react';
import { getRoleDisplayName, getRoleColor } from '../../../constants/skills';

interface ProfileHeaderProps {
  name: string;
  role: string | null;
  bio: string;
  techStacks: string[];
  avatarUrl?: string;
  onAvatarClick: () => void;
  onEditInfo: () => void;
  onWithdraw: () => void;
}

const HIGHLIGHTED_STACKS = ['Firebase'];

const ProfileHeader = ({
  name,
  role,
  bio,
  techStacks,
  avatarUrl,
  onAvatarClick,
  onEditInfo,
  onWithdraw,
}: ProfileHeaderProps) => {
  return (
    <div className="bg-white rounded-2xl p-8 w-full shadow-sm">
      <div className="flex items-center gap-6">
        {/* 아바타 영역 */}
        <button
          type="button"
          onClick={onAvatarClick}
          className="w-24 h-24 rounded-full bg-primary flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-4xl">🐝</span>
          )}
        </button>

        {/* 프로필 정보 영역 */}
        <div className="flex flex-col gap-2 flex-1">
          {/* 이름 + 역할 배지 */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-text-primary">{name}</span>
            {role && (
              <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: `${getRoleColor(role)}1a`, color: getRoleColor(role) }}>
                {getRoleDisplayName(role)}
              </span>
            )}
          </div>

          {/* 소개글 */}
          <p className="text-sm text-text-secondary">{bio}</p>

          {/* 기술 스택 태그 */}
          <div className="flex gap-2 flex-wrap mt-1">
            {techStacks.map((stack) =>
              HIGHLIGHTED_STACKS.includes(stack) ? (
                <span
                  key={stack}
                  className="px-3 py-1 rounded-full border border-primary text-text-brown-2 text-xs font-medium"
                >
                  {stack}
                </span>
              ) : (
                <span
                  key={stack}
                  className="px-3 py-1 rounded-full border border-border text-text-secondary text-xs font-medium"
                >
                  {stack}
                </span>
              )
            )}
          </div>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={onEditInfo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary font-semibold text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            정보수정
          </button>
          <button
            type="button"
            onClick={onWithdraw}
            className="flex items-center gap-1.5 text-text-tertiary hover:text-text-secondary text-sm transition-colors"
          >
            <UserX className="w-4 h-4" />
            탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
