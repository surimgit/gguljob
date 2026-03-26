import { useState, useEffect } from 'react';
import { Send, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionEmptyState } from '../../common';
import { getMyApplications, type MyApplicationDto } from '../../../api/user';

// ── 상태 뱃지 ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<MyApplicationDto['status'], { label: string; color: string; bg: string }> = {
  PENDING:  { label: '대기중', color: '#ca8a04', bg: '#fefce8' },
  ACCEPTED: { label: '수락됨', color: '#16a34a', bg: '#f0fdf4' },
  REJECTED: { label: '거절됨', color: '#dc2626', bg: '#fef2f2' },
};

const TYPE_LABEL: Record<MyApplicationDto['requestType'], string> = {
  APPLY:  '지원',
  INVITE: '초대',
};

// ── 시간 포맷 ──────────────────────────────────────────────────────────────────
const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}개월 전`;
};

// ── 아이템 카드 ────────────────────────────────────────────────────────────────
const ApplicationItem = ({ item }: { item: MyApplicationDto }) => {
  const status = STATUS_MAP[item.status];

  return (
    <div className="flex flex-col gap-2 border-2 border-border rounded-2xl px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-text-primary leading-snug truncate">
          {item.projectTitle}
        </h3>
        <span className="flex-shrink-0 text-[10px] text-text-tertiary">
          {formatTimeAgo(item.createdAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f3f4f6] text-[#374151]">
          {TYPE_LABEL[item.requestType]}
        </span>
        {item.positionName && (
          <span className="text-[11px] text-text-secondary">
            {item.positionName}
          </span>
        )}
      </div>
    </div>
  );
};

// ── 스켈레톤 ───────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col gap-2 border-2 border-border rounded-2xl px-4 py-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="flex gap-2">
      <div className="h-4 bg-gray-200 rounded w-12" />
      <div className="h-4 bg-gray-200 rounded w-10" />
    </div>
  </div>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const MyApplications = () => {
  const [items, setItems] = useState<MyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then((data) => setItems(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
          <Send className="w-5 h-5 text-text-primary" />
          <span>지원 내역</span>
        </h2>
        <Link
          to="/mypage/applications"
          className="text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="지원 내역 전체보기"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* 목록 */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : items.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto scrollbar-hide pr-1">
            {items.map((item) => (
              <ApplicationItem key={item.requestId} item={item} />
            ))}
          </div>
        ) : (
          <SectionEmptyState message="지원 내역이 없습니다." />
        )}
      </div>
    </div>
  );
};

export default MyApplications;
