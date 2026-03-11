import { X, Settings } from 'lucide-react';
import { BaseModal } from '../../common';

const STACK_COLORS = [
  'border-sky-300 text-sky-600',
  'border-purple-300 text-purple-600',
  'border-pink-300 text-pink-600',
  'border-green-300 text-green-600',
  'border-amber-300 text-amber-600',
];

const PROJECT_BG: Record<string, string> = {
  amber: 'bg-amber-100',
  green: 'bg-green-100',
  sky: 'bg-sky-100',
  purple: 'bg-purple-100',
};

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  user: {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatarUrl?: string;
    techStacks: string[];
    projects: {
      id: string;
      name: string;
      description: string;
      emoji: string;
      bgColor: 'amber' | 'green' | 'sky' | 'purple';
      myRole: string;
      period: string;
      techStacks: string[];
    }[];
  };
}

const MyProfileModal = ({ isOpen, onClose, onEdit, user }: MyProfileModalProps) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="bg-white rounded-3xl w-[720px] overflow-hidden shadow-2xl"
    >
      {/* 상단 amber 바 */}
      <div className="h-14 bg-amber-400 w-full relative flex items-center justify-end px-5">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* 프로필 헤더 */}
      <div className="flex items-center gap-5 px-10 py-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">🐝</span>
          )}
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{user.name}</span>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              {user.role}
            </span>
          </div>
          <p className="text-sm text-gray-500">{user.bio}</p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-cta font-semibold text-sm ml-auto transition-colors"
        >
          <Settings className="w-4 h-4" />
          개인정보 수정
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="bg-stone-100 mx-4 mb-4 rounded-2xl p-6">
        <div className="flex justify-between gap-6">
          {/* 기술 스택 섹션 */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-4">
              🛠 기술 스택
            </h3>
            <div className="flex flex-col gap-2">
              {user.techStacks.map((stack, i) => (
                <span
                  key={stack}
                  className={`px-4 py-2 rounded-full border-2 bg-white text-sm font-medium w-fit ${STACK_COLORS[i % STACK_COLORS.length]}`}
                >
                  {stack}
                </span>
              ))}
            </div>
          </div>

          {/* 대표 프로젝트 섹션 */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-4">
              🚀 대표 프로젝트
            </h3>
            <div className="flex gap-3">
              {user.projects.slice(0, 2).map((project, pi) => (
                <div key={project.id} className="bg-white rounded-2xl overflow-hidden flex-1">
                  <div className={`p-4 pb-3 ${PROJECT_BG[project.bgColor] ?? 'bg-gray-100'}`}>
                    <span className="text-2xl mb-2 block">{project.emoji}</span>
                    <p className="text-base font-bold text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{project.description}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-400 mb-2">
                      {project.myRole} · {project.period}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStacks.map((stack, i) => (
                        <span
                          key={stack}
                          className={`px-3 py-1 rounded-full border-2 bg-white text-xs font-medium ${STACK_COLORS[(pi * 2 + i) % STACK_COLORS.length]}`}
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default MyProfileModal;
