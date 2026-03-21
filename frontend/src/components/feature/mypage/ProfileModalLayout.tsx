import { useReducer, useRef, useEffect, type ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BaseModal } from '../../common';

export const STACK_COLORS = [
  'border-sky-300 text-sky-600',
  'border-purple-300 text-purple-600',
  'border-pink-300 text-pink-600',
  'border-green-300 text-green-600',
  'border-amber-300 text-amber-600',
];

export const PROJECT_BG: Record<string, string> = {
  amber: 'bg-amber-100',
  green: 'bg-green-100',
  sky: 'bg-sky-100',
  purple: 'bg-purple-100',
};

const STATUS_BADGE: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  진행중: { label: '진행중', dot: '#22c55e', bg: 'rgba(34,197,94,0.15)', text: '#16a34a' },
  모집중: { label: '모집중', dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)', text: '#d97706' },
  완료:   { label: '완료',   dot: '#9ca3af', bg: 'rgba(156,163,175,0.15)', text: '#6b7280' },
  중단:   { label: '중단',   dot: '#ef4444', bg: 'rgba(239,68,68,0.15)', text: '#dc2626' },
};

const MAX_ROWS_PER_PAGE = 4;

export interface ProfileProject {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bgColor: 'amber' | 'green' | 'sky' | 'purple';
  myRole: string;
  period: string;
  techStacks: string[];
}

export interface ProfileUser {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  techStacks: string[];
  projects: ProfileProject[];
}

interface ProfileModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser;
  actionButton: ReactNode;
  containerClassName?: string;
}

type StackState = { page: number; pages: string[][] };
type StackAction =
  | { type: 'reset'; pages: string[][] }
  | { type: 'prev' }
  | { type: 'next' };

const stackReducer = (state: StackState, action: StackAction): StackState => {
  switch (action.type) {
    case 'reset': return { page: 0, pages: action.pages };
    case 'prev':  return { ...state, page: Math.max(0, state.page - 1) };
    case 'next':  return { ...state, page: Math.min(state.pages.length - 1, state.page + 1) };
  }
};

const ProfileModalLayout = ({ isOpen, onClose, user, actionButton, containerClassName = "bg-white rounded-3xl w-[900px] overflow-hidden shadow-2xl" }: ProfileModalLayoutProps) => {
  const [{ page: stackPage, pages }, dispatch] = useReducer(stackReducer, { page: 0, pages: [[]] });
  const containerHeight = MAX_ROWS_PER_PAGE * 40 + (MAX_ROWS_PER_PAGE - 1) * 8;
  const measureRef = useRef<HTMLDivElement>(null);
  const stackSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !measureRef.current || !stackSectionRef.current) return;

    const sectionWidth = stackSectionRef.current.offsetWidth;
    measureRef.current.style.width = `${sectionWidth}px`;

    const spans = Array.from(measureRef.current.querySelectorAll('span'));
    const rows: string[][] = [];
    let lastTop = -1;

    spans.forEach((span, i) => {
      const top = (span as HTMLElement).offsetTop;
      if (top !== lastTop) {
        rows.push([]);
        lastTop = top;
      }
      rows[rows.length - 1].push(user.techStacks[i]);
    });

    const newPages: string[][] = [];
    for (let i = 0; i < rows.length; i += MAX_ROWS_PER_PAGE) {
      newPages.push(rows.slice(i, i + MAX_ROWS_PER_PAGE).flat());
    }

    dispatch({ type: 'reset', pages: newPages.length > 0 ? newPages : [[]] });
  }, [isOpen, user.techStacks]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName={containerClassName}
    >
      {/* 상단 바 */}
      <div className="h-14 bg-primary w-full relative flex items-center justify-end px-5">
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
        <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">🐝</span>
          )}
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-text-primary">{user.name}</span>
            <span className="px-3 py-1 rounded-full bg-primary-soft text-text-brown text-sm font-medium">
              {user.role}
            </span>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">{user.bio}</p>
        </div>

        {actionButton}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="bg-background mx-4 mb-4 rounded-2xl p-6">
        <div className="flex gap-6">
          {/* 기술 스택 섹션 */}
          <div ref={stackSectionRef} className="flex-[35] min-w-0">
            {/* 측정용 숨김 렌더링 */}
            <div
              ref={measureRef}
              className="flex flex-wrap gap-2 invisible absolute"
              aria-hidden="true"
            >
              {user.techStacks.map((stack, i) => (
                <span
                  key={stack}
                  className={`px-4 py-2 rounded-full border-2 bg-white text-sm font-medium whitespace-nowrap max-w-[160px] truncate ${STACK_COLORS[i % STACK_COLORS.length]}`}
                >
                  {stack}
                </span>
              ))}
            </div>

            <h3 className="flex items-center gap-2 text-base font-bold text-text-primary mb-4">
              🛠 기술 스택
            </h3>

            <div className="overflow-hidden" style={{ height: containerHeight }}>
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${stackPage * 100}%)` }}
              >
                {pages.map((pageStacks, pageIdx) => (
                  <div
                    key={pageIdx}
                    className="flex flex-wrap gap-2 content-start flex-shrink-0 w-full"
                  >
                    {pageStacks.map((stack, i) => {
                      const globalIdx = pages.slice(0, pageIdx).flat().length + i;
                      return (
                        <span
                          key={stack}
                          className={`px-4 py-2 rounded-full border-2 bg-white text-sm font-medium whitespace-nowrap max-w-[160px] truncate ${STACK_COLORS[globalIdx % STACK_COLORS.length]}`}
                        >
                          {stack}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {pages.length > 1 && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'prev' })}
                  disabled={stackPage === 0}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-border text-text-secondary disabled:opacity-30 hover:bg-background transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-xs text-text-tertiary">{stackPage + 1} / {pages.length}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'next' })}
                  disabled={stackPage === pages.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-border text-text-secondary disabled:opacity-30 hover:bg-background transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* 대표 프로젝트 섹션 */}
          <div className="flex-[65] min-w-0">
            <h3 className="flex items-center gap-2 text-base font-bold text-text-primary mb-4">
              🚀 대표 프로젝트
            </h3>
            <div className="flex gap-3">
              {user.projects.slice(0, 2).map((project, pi) => (
                <div key={project.id} className={`rounded-2xl overflow-hidden flex-1 ${PROJECT_BG[project.bgColor] ?? 'bg-gray-100'}`}>
                  <div className="p-4 pb-3">
                    <span className="text-2xl mb-2 block">{project.emoji}</span>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-text-primary">{project.name}</p>
                      {STATUS_BADGE[project.period] && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: STATUS_BADGE[project.period].bg,
                            color: STATUS_BADGE[project.period].text,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: STATUS_BADGE[project.period].dot }}
                          />
                          {STATUS_BADGE[project.period].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-2">{project.description}</p>
                  </div>
                  <div className="px-4 py-3">
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

export default ProfileModalLayout;
