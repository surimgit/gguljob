import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Pagination from '../components/common/Pagination';
import { getMyApplications, type MyApplicationDto } from '../api/user';

// ── 상수 ────────────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

type FilterTab = 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

const STATUS_MAP: Record<MyApplicationDto['status'], { label: string; color: string; bg: string }> = {
  PENDING:  { label: '대기중', color: '#ca8a04', bg: '#fefce8' },
  ACCEPTED: { label: '수락됨', color: '#16a34a', bg: '#f0fdf4' },
  REJECTED: { label: '거절됨', color: '#dc2626', bg: '#fef2f2' },
};

const TYPE_LABEL: Record<MyApplicationDto['requestType'], string> = {
  APPLY:  '지원',
  INVITE: '초대',
};

const BADGE_STYLES: Record<FilterTab, { border: string; bg: string }> = {
  all:      { border: 'var(--color-primary)', bg: 'var(--color-primary-soft)' },
  PENDING:  { border: '#ca8a04', bg: '#fefce8' },
  ACCEPTED: { border: '#16a34a', bg: '#f0fdf4' },
  REJECTED: { border: '#dc2626', bg: '#fef2f2' },
};

// ── 날짜 포맷 ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

// ── 카드 컴포넌트 ──────────────────────────────────────────────────────────────
const ApplicationCard = ({ item }: { item: MyApplicationDto }) => {
  const navigate = useNavigate();
  const status = STATUS_MAP[item.status];

  return (
    <div
      onClick={() => navigate(item.status === 'ACCEPTED' ? `/my-projects/${item.projectId}` : `/projects`)}
      className="flex items-center justify-between gap-4 bg-surface border-2 border-border rounded-2xl px-6 py-5 hover:shadow-md hover:border-primary-hover transition-all cursor-pointer"
    >
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <h3 className="text-[16px] font-bold text-text-primary truncate">
          {item.projectTitle}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2.5 py-0.5 rounded-md text-[11px] font-bold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#f3f4f6] text-[#374151]">
            {TYPE_LABEL[item.requestType]}
          </span>
          {item.positionName && (
            <span className="text-[12px] text-text-secondary">
              {item.positionName}
            </span>
          )}
        </div>
      </div>
      <span className="text-[12px] text-text-tertiary flex-shrink-0">
        {formatDate(item.createdAt)}
      </span>
    </div>
  );
};

// ── 스켈레톤 ───────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex items-center justify-between gap-4 bg-surface border-2 border-border rounded-2xl px-6 py-5 animate-pulse">
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="h-5 bg-gray-200 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-4 bg-gray-200 rounded w-10" />
      </div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-20" />
  </div>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const ApplicationList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getMyApplications()
      .then((data) => setItems(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((item) => item.status === activeTab);
  }, [items, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const counts = useMemo(() => ({
    all: items.length,
    PENDING: items.filter((i) => i.status === 'PENDING').length,
    ACCEPTED: items.filter((i) => i.status === 'ACCEPTED').length,
    REJECTED: items.filter((i) => i.status === 'REJECTED').length,
  }), [items]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{ backgroundColor: 'var(--color-background)' }}
      className="min-h-screen"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            지원 내역
          </h1>
        </div>

        {/* 필터 뱃지 */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {([
            { key: 'all' as FilterTab, label: `전체 ${counts.all}건` },
            { key: 'PENDING' as FilterTab, label: `대기중 ${counts.PENDING}` },
            { key: 'ACCEPTED' as FilterTab, label: `수락됨 ${counts.ACCEPTED}` },
            { key: 'REJECTED' as FilterTab, label: `거절됨 ${counts.REJECTED}` },
          ]).map((badge) => {
            const style = BADGE_STYLES[badge.key];
            const isActive = activeTab === badge.key;
            return (
              <button
                key={badge.key}
                onClick={() => setActiveTab(badge.key)}
                className="px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive ? style.bg : 'var(--color-surface)',
                  color: isActive ? style.border : 'var(--color-text-primary)',
                  border: isActive
                    ? `2px solid ${style.border}`
                    : '2px solid var(--color-border)',
                }}
              >
                {badge.label}
              </button>
            );
          })}
        </div>

        {/* 리스트 */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : paginated.length > 0 ? (
            paginated.map((item) => (
              <ApplicationCard key={item.requestId} item={item} />
            ))
          ) : (
            <p className="text-center py-12 text-sm text-text-tertiary">
              {activeTab === 'all' ? '지원 내역이 없습니다.' : '해당하는 내역이 없습니다.'}
            </p>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Pagination current={currentPage} totalPages={totalPages} onChange={goToPage} className="py-10" />
        )}
      </div>
    </div>
  );
};

export default ApplicationList;
