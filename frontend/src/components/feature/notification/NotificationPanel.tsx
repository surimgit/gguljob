// ── 타입 ──────────────────────────────────────────────────────────────────────
type NotifType = 'team_accept' | 'join_request' | 'job_posting' | 'team_reject';

interface Notification {
  id: number;
  type: NotifType;
  message: string;
  time: string;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'team_accept',
    message: "'DevMatch' 팀원으로 수락되었습니다.",
    time: '10분 전',
  },
  {
    id: 2,
    type: 'join_request',
    message: "'React 스터디'에 새로운 참가 요청이 도착했습니다.",
    time: '1시간 전',
  },
  {
    id: 3,
    type: 'job_posting',
    message: "'토스(Toss)'의 프론트엔드 새 공고가 등록되었습니다.",
    time: '3시간 전',
  },
  {
    id: 4,
    type: 'team_reject',
    message: "'사이드 프로젝트 A' 팀 합류가 거절되었습니다.",
    time: '1일 전',
  },
  {
    id: 5,
    type: 'join_request',
    message: "'알고리즘 스터디'에 새로운 참가 요청이 도착했습니다.",
    time: '2일 전',
  },
];

// ── 알림 아이콘 ───────────────────────────────────────────────────────────────
const NotifIcon = ({ type }: { type: NotifType }) => {
  if (type === 'team_accept') {
    return (
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 40, height: 40, background: '#e8e8f5' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      </div>
    );
  }

  if (type === 'join_request') {
    return (
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 40, height: 40, background: '#f0e8f5' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="16" y1="11" x2="22" y2="11" />
        </svg>
      </div>
    );
  }

  if (type === 'job_posting') {
    return (
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 40, height: 40, background: '#e8f5e8' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      </div>
    );
  }

  // team_reject
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: 40, height: 40, border: '2px solid #e05555' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
};

// ── 알림 아이템 ───────────────────────────────────────────────────────────────
const NotificationItem = ({ notif }: { notif: Notification }) => (
  <div className="flex items-start gap-3.5 bg-surface rounded-xl px-5 pt-4 pb-4 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.06)]">
    <NotifIcon type={notif.type} />
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <p className="text-[14px] text-text-primary leading-[21px]">{notif.message}</p>
      <p className="text-[12px] text-text-tertiary leading-[19px]">{notif.time}</p>
    </div>
  </div>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const NotificationPanel = () => (
  <div className="absolute right-0 top-full mt-2 flex flex-col overflow-hidden z-50 w-[360px] bg-surface rounded-2xl shadow-[0px_4px_24px_0px_rgba(0,0,0,0.1)]">
    {/* 헤더 */}
    <div className="flex items-center gap-2 px-5 h-[57px] bg-primary-hover">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span className="text-white font-bold text-[16px]">알림</span>
    </div>

    {/* 알림 목록 */}
    <div className="flex flex-col gap-1.5 p-3 overflow-y-auto max-h-[420px]">
      {MOCK_NOTIFICATIONS.map(notif => (
        <NotificationItem key={notif.id} notif={notif} />
      ))}
    </div>
  </div>
);

export default NotificationPanel;