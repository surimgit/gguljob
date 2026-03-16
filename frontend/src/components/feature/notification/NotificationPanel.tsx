// ── 타입 ──────────────────────────────────────────────────────────────────────
export type NotifType = 'team_accept' | 'join_request' | 'job_posting' | 'team_reject';

export interface Notification {
  id: number;
  type: NotifType;
  message: string;
  time: string;
}

// ── 초기 더미 데이터 (Navbar에서 state 초기값으로 사용) ──────────────────────
export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'team_accept',  message: "'DevMatch' 팀원으로 수락되었습니다.",                 time: '10분 전' },
  { id: 2, type: 'join_request', message: "'React 스터디'에 새로운 참가 요청이 도착했습니다.",   time: '1시간 전' },
  { id: 3, type: 'job_posting',  message: "'토스(Toss)'의 프론트엔드 새 공고가 등록되었습니다.", time: '3시간 전' },
  { id: 4, type: 'team_reject',  message: "'사이드 프로젝트 A' 팀 합류가 거절되었습니다.",       time: '1일 전' },
  { id: 5, type: 'join_request', message: "'알고리즘 스터디'에 새로운 참가 요청이 도착했습니다.", time: '2일 전' },
];

// ── 알림 아이콘 ───────────────────────────────────────────────────────────────
const ICON_CONFIG: Record<NotifType, { wrapperClass: string; iconEl: React.ReactNode }> = {
  team_accept: {
    wrapperClass: 'bg-[#e8e8f5]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
  },
  join_request: {
    wrapperClass: 'bg-[#f0e8f5]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    ),
  },
  job_posting: {
    wrapperClass: 'bg-[#e8f5e8]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  team_reject: {
    wrapperClass: 'border-2 border-[#e05555]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
};

const NotifIcon = ({ type }: { type: NotifType }) => {
  const { wrapperClass, iconEl } = ICON_CONFIG[type];
  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${wrapperClass}`}>
      {iconEl}
    </div>
  );
};

// ── 알림 아이템 ───────────────────────────────────────────────────────────────
const NotificationItem = ({ notif, onDelete }: { notif: Notification; onDelete: (id: number) => void }) => (
  <div className="group flex items-start gap-3.5 bg-surface rounded-xl px-5 pt-4 pb-4 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)]">
    <NotifIcon type={notif.type} />
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <p className="text-[14px] text-text-primary leading-[21px]">{notif.message}</p>
      <p className="text-[12px] text-text-tertiary leading-[19px]">{notif.time}</p>
    </div>
    <button
      onClick={() => onDelete(notif.id)}
      aria-label="알림 삭제"
      className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-text-primary transition-all duration-150"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
);

// ── 빈 상태 UI ────────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-soft">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F2B705" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </div>
    <p className="text-[14px] text-text-secondary font-medium">새로운 알림이 없습니다</p>
    <p className="text-[12px] text-text-tertiary">새 알림이 오면 여기에 표시됩니다</p>
  </div>
);

// ── 메인 컴포넌트 (state는 Navbar에서 관리, props로 전달) ──────────────────────
interface NotificationPanelProps {
  notifications: Notification[];
  onDelete: (id: number) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const NotificationPanel = ({ notifications, onDelete, onClearAll, onClose }: NotificationPanelProps) => (
  <div className="absolute right-0 top-full mt-2 flex flex-col overflow-hidden z-50 w-[360px] bg-surface rounded-2xl shadow-[0px_4px_24px_0px_rgba(0,0,0,0.1)]">
    {/* 헤더 */}
    <div className="flex items-center justify-between px-5 h-[57px] bg-primary-hover">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="text-white font-bold text-[16px]">알림</span>
      </div>
      <div className="flex items-center gap-3">
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-white text-[13px] font-bold opacity-90 hover:opacity-100 transition-opacity"
          >
            모두 지우기
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="알림창 닫기"
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    {/* 알림 목록 or 빈 상태 */}
    <div className="flex flex-col gap-1.5 p-3 overflow-y-auto max-h-[420px]">
      {notifications.length > 0 ? (
        notifications.map(notif => (
          <NotificationItem key={notif.id} notif={notif} onDelete={onDelete} />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  </div>
);

export default NotificationPanel;