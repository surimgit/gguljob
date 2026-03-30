import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationCategory, ActionStatus } from '../../../api/notification';
import { acceptRequest, rejectRequest } from '../../../api/projects';

// ── 타입 ──────────────────────────────────────────────────────────────────────
export type NotifType = NotificationCategory;

export interface Notification {
  id: number;
  type: NotifType;
  message: string;
  time: string;
  isRead: boolean;
  actionStatus: ActionStatus;
  referenceId: number | null;
  referenceUrl: string | null;
}

// ── 알림 아이콘 ───────────────────────────────────────────────────────────────
const ICON_CONFIG: Partial<Record<NotifType, { wrapperClass: string; iconEl: React.ReactNode }>> = {
  // 초대 / 지원 요청 — 사람 + 플러스
  TEAM_INVITE: {
    wrapperClass: 'bg-[#e8e8f5]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    ),
  },
  TEAM_APPLY: {
    wrapperClass: 'bg-[#e8e8f5]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    ),
  },
  // 수락됨 — 사람 + 체크
  TEAM_ACCEPTED: {
    wrapperClass: 'bg-[#dcfce7]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
  },
  // 거절됨 — 사람 + X
  TEAM_REJECTED: {
    wrapperClass: 'bg-[#fee2e2]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="17" y1="9" x2="23" y2="15" />
        <line x1="23" y1="9" x2="17" y2="15" />
      </svg>
    ),
  },
  MEMBER: {
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
  JOB_POSTING: {
    wrapperClass: 'bg-[#e8f5e8]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  TROUBLESHOOTING: {
    wrapperClass: 'bg-[#fef3c7]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  GITHUB: {
    wrapperClass: 'bg-[#f0f0f0]',
    iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#24292f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
      </svg>
    ),
  },
};

const FALLBACK_ICON = {
  wrapperClass: 'bg-[#e5e7eb]',
  iconEl: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const NotifIcon = ({ type }: { type: NotifType }) => {
  const { wrapperClass, iconEl } = ICON_CONFIG[type] ?? FALLBACK_ICON;
  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${wrapperClass}`}>
      {iconEl}
    </div>
  );
};

// ── 알림 아이템 ───────────────────────────────────────────────────────────────
const NotificationItem = ({
  notif,
  onDelete,
  onMarkRead,
  onClose,
}: {
  notif: Notification;
  onDelete: (id: number) => void;
  onMarkRead: (id: number) => void;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [actionDone, setActionDone] = useState<'accepted' | 'rejected' | null>(
    notif.actionStatus === 'ACCEPTED' ? 'accepted'
      : notif.actionStatus === 'REJECTED' ? 'rejected'
      : null
  );
  const [loading, setLoading] = useState(false);

  const isInvite = (notif.type === 'TEAM_INVITE' || notif.type === 'TEAM_APPLY')
    && notif.referenceId !== null;
  const isPending = isInvite && notif.actionStatus === 'PENDING' && !actionDone;

  const handleClick = () => {
    if (!notif.isRead && !isPending) onMarkRead(notif.id);
    if (isPending) {
      setExpanded(prev => !prev);
      return;
    }
    // referenceUrl이 있으면 해당 페이지로 이동
    if (notif.referenceUrl) {
      onClose();
      if (notif.referenceUrl.startsWith('http')) {
        window.open(notif.referenceUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(notif.referenceUrl);
      }
    }
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notif.referenceId || loading) return;
    setLoading(true);
    try {
      await acceptRequest(notif.referenceId);
      setActionDone('accepted');
      setExpanded(false);
      if (!notif.isRead) onMarkRead(notif.id);
    } catch (err) {
      console.error('초대 수락 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notif.referenceId || loading) return;
    setLoading(true);
    try {
      await rejectRequest(notif.referenceId);
      setActionDone('rejected');
      setExpanded(false);
      if (!notif.isRead) onMarkRead(notif.id);
    } catch (err) {
      console.error('초대 거절 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex flex-col rounded-xl px-5 pt-4 pb-4 transition-shadow duration-200 hover:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] ${
        notif.isRead
          ? `bg-[#f9fafb] shadow-none ${notif.referenceUrl ? 'cursor-pointer' : 'cursor-default'}`
          : 'bg-surface shadow-[0px_1px_4px_0px_rgba(0,0,0,0.06)] cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <NotifIcon type={notif.type} />

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className={`text-base leading-[21px] break-words ${notif.isRead ? 'text-text-secondary font-normal' : 'text-text-primary font-bold'}`}>
            {notif.message}
          </p>
          <p className="text-[12px] text-text-tertiary leading-[19px]">{notif.time}</p>
          {actionDone && (
            <p className={`text-[12px] font-semibold mt-0.5 ${actionDone === 'accepted' ? 'text-[#16a34a]' : 'text-text-tertiary'}`}>
              {actionDone === 'accepted' ? '수락됨' : '거절됨'}
            </p>
          )}
        </div>

        {/* 오른쪽: 안 읽은 파란 점 (hover 시 삭제 버튼으로 교체) */}
        <div className="flex-shrink-0 flex items-center self-stretch">
          {!notif.isRead && (
            <span className="w-2 h-2 rounded-full bg-blue group-hover:hidden" />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
            aria-label="알림 삭제"
            className={`w-5 h-5 flex items-center justify-center rounded-full text-text-tertiary hover:bg-gray-100 hover:text-text-primary transition-all duration-150 ${
              notif.isRead ? 'opacity-0 group-hover:opacity-100' : 'hidden group-hover:flex'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* 초대 수락/거절 버튼 */}
      {isInvite && expanded && !actionDone && (
        <div className="flex gap-2 mt-3 ml-[52px]">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#16a34a' }}
          >
            수락
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-text-secondary border border-border bg-white transition-colors hover:bg-[#f9fafb] disabled:opacity-50"
          >
            거절
          </button>
        </div>
      )}
    </div>
  );
};

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
  onMarkRead: (id: number) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const NotificationPanel = ({ notifications, onDelete, onMarkRead, onClearAll, onClose }: NotificationPanelProps) => {
  const handleClearAll = () => {
    onClearAll();
  };

  return (
  <div className="absolute top-full mt-2 flex flex-col overflow-hidden z-50 bg-surface rounded-2xl shadow-[0px_4px_24px_0px_rgba(0,0,0,0.1)] w-[calc(100vw-32px)] max-w-[420px] right-0 sm:w-[420px]">
    {/* 헤더 */}
    <div className="flex items-center justify-between px-5 h-[57px] bg-primary-hover">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="text-white font-semibold text-[20px]">알림</span>
        {notifications.some(n => !n.isRead) && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-primary-hover text-[11px] font-bold">
            {notifications.filter(n => !n.isRead).length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-white text-[15px] font-semibold opacity-90 hover:opacity-100 transition-opacity"
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

    {/* 알림 목록 or 빈 상태 (백엔드 정렬: PENDING 최우선 → 안 읽은 것 → 최신순) */}
    <div className="flex flex-col gap-1.5 p-3 overflow-y-auto max-h-[420px]">
      {notifications.length > 0 ? (
        notifications.map(notif => (
          <NotificationItem key={notif.id} notif={notif} onDelete={onDelete} onMarkRead={onMarkRead} onClose={onClose} />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  </div>
  );
};

export default NotificationPanel;
