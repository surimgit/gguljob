import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import BaseModal from '../components/common/BaseModal';
import { getMyApplications, type MyApplicationDto } from '../api/user';
import { cancelRequest } from '../api/projects';

// ── 상수 ────────────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

type FilterTab = 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

const STATUS_MAP: Record<MyApplicationDto['status'], { label: string; color: string; bg: string }> = {
  PENDING:  { label: '대기중', color: '#ca8a04', bg: '#fefce8' },
  ACCEPTED: { label: '수락됨', color: '#16a34a', bg: '#f0fdf4' },
  REJECTED: { label: '거절됨', color: '#dc2626', bg: '#fef2f2' },
  CANCELED: { label: '취소됨', color: '#6b7280', bg: '#f3f4f6' },
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
  CANCELED: { border: '#6b7280', bg: '#f3f4f6' },
};

// ── 날짜 포맷 ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

// ── 카드 컴포넌트 ──────────────────────────────────────────────────────────────
const ApplicationCard = ({ item, onCancelClick }: { item: MyApplicationDto; onCancelClick: (item: MyApplicationDto) => void }) => {
  const navigate = useNavigate();
  const status = STATUS_MAP[item.status];

  const handleCardClick = () => {
    if (item.status === 'ACCEPTED') navigate(`/my-projects/${item.projectId}`);
    else if (item.status !== 'CANCELED') navigate('/projects');
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelClick(item);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`flex items-center justify-between gap-4 bg-surface border-2 border-border rounded-2xl px-6 py-5 transition-all ${item.status === 'CANCELED' ? 'opacity-60' : 'hover:shadow-md hover:border-primary-hover cursor-pointer'}`}
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
      <div className="flex items-center gap-3 flex-shrink-0">
        {item.status === 'PENDING' && (
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-[#dc2626] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors"
          >
            취소
          </button>
        )}
        <span className="text-[12px] text-text-tertiary">
          {formatDate(item.createdAt)}
        </span>
      </div>
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
  const [cancelTarget, setCancelTarget] = useState<MyApplicationDto | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getMyApplications()
      .then((data) => setItems(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelRequest(cancelTarget.requestId);
      setItems((prev) => prev.map((item) =>
        item.requestId === cancelTarget.requestId ? { ...item, status: 'CANCELED' as const } : item
      ));
      setCancelTarget(null);
      toast.success(cancelTarget.requestType === 'INVITE' ? '초대가 취소되었습니다.' : '지원이 취소되었습니다.');
    } catch {
      alert('취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCancelling(false);
    }
  }, [cancelTarget]);

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
    CANCELED: items.filter((i) => i.status === 'CANCELED').length,
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
            { key: 'CANCELED' as FilterTab, label: `취소됨 ${counts.CANCELED}` },
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
              <ApplicationCard key={item.requestId} item={item} onCancelClick={setCancelTarget} />
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

      {/* 취소 확인 모달 */}
      <BaseModal
        isOpen={!!cancelTarget}
        onClose={() => !cancelling && setCancelTarget(null)}
        containerClassName="bg-white rounded-[20px] w-[400px] shadow-2xl p-[32px] text-center"
      >
        <div className="flex justify-center mb-[20px]">
          <div className="w-[56px] h-[56px] rounded-full bg-[#fef2f2] flex items-center justify-center">
            <X size={28} className="text-[#dc2626]" />
          </div>
        </div>
        <h3 className="font-black text-[#111827] text-[18px] mb-[8px]">
          {cancelTarget?.requestType === 'INVITE' ? '초대를 취소하시겠습니까?' : '지원을 취소하시겠습니까?'}
        </h3>
        <p className="text-[#9ca3af] text-[14px] font-bold mb-[28px]">
          <span className="text-[#111827]">{cancelTarget?.projectTitle}</span>
          {cancelTarget?.requestType === 'INVITE' ? ' 초대가' : ' 지원이'} 취소됩니다.
        </p>
        <div className="flex gap-[12px]">
          <button
            onClick={() => setCancelTarget(null)}
            disabled={cancelling}
            className="flex-1 py-[14px] rounded-[12px] border-2 border-[#e5e7eb] text-[#6b7280] font-bold text-[14px] hover:bg-[#f7f8fa] transition-colors"
          >
            돌아가기
          </button>
          <button
            onClick={handleCancelConfirm}
            disabled={cancelling}
            className="flex-1 py-[14px] rounded-[12px] bg-[#dc2626] text-white font-bold text-[14px] hover:bg-[#b91c1c] transition-colors disabled:opacity-50"
          >
            {cancelling ? '취소 중...' : '취소하기'}
          </button>
        </div>
      </BaseModal>
    </div>
  );
};

export default ApplicationList;
