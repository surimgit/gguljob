import { Settings, UserX } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  role: string;
  bio: string;
  techStacks: string[];
  avatarUrl?: string;
  onEdit: () => void;
  onWithdraw: () => void;
}

const HIGHLIGHTED_STACKS = ['Firebase'];

const ProfileHeader = ({
  name,
  role,
  bio,
  techStacks,
  avatarUrl,
  onEdit,
  onWithdraw,
}: ProfileHeaderProps) => {
  return (
    <div className="bg-white rounded-2xl p-8 w-full shadow-sm">
      <div className="flex items-center gap-6">
        {/* 아바타 영역 */}
        <div className="w-24 h-24 rounded-full bg-yellow-300 flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-4xl">🐝</span>
          )}
        </div>

        {/* 프로필 정보 영역 */}
        <div className="flex flex-col gap-2 flex-1">
          {/* 이름 + 역할 배지 */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{name}</span>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              {role}
            </span>
          </div>

          {/* 소개글 */}
          <p className="text-sm text-gray-500">{bio}</p>

          {/* 기술 스택 태그 */}
          <div className="flex gap-2 flex-wrap mt-1">
            {techStacks.map((stack) =>
              HIGHLIGHTED_STACKS.includes(stack) ? (
                <span
                  key={stack}
                  className="px-3 py-1 rounded-full border border-amber-300 text-amber-600 text-xs font-medium"
                >
                  {stack}
                </span>
              ) : (
                <span
                  key={stack}
                  className="px-3 py-1 rounded-full border border-gray-200 text-gray-600 text-xs font-medium"
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
            onClick={onEdit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            정보수정
          </button>
          <button
            type="button"
            onClick={onWithdraw}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm transition-colors"
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
