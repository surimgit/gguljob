import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import TroubleshootingCard from '../components/feature/troubleshooting/TroubleshootingCard';
import type { TroubleshootingCardItem } from '../components/feature/troubleshooting/TroubleshootingCard';

const MOCK_DATA: TroubleshootingCardItem[] = [];

const ITEMS_PER_PAGE = 5;
type FilterTab = 'all' | 'in_progress' | 'resolved';

const BADGE_STYLES: Record<
  FilterTab,
  { bg: string; border: string; color: string }
> = {
  all: {
    bg: 'var(--color-primary-soft)',
    border: 'var(--color-primary)',
    color: 'var(--color-text-primary)',
  },
  resolved: {
    bg: 'rgba(var(--color-success-rgb, 34,197,94), 0.26)',
    border: 'var(--color-success)',
    color: 'var(--color-text-primary)',
  },
  in_progress: {
    bg: 'rgba(var(--color-warning-rgb, 245,158,11), 0.26)',
    border: 'var(--color-warning)',
    color: 'var(--color-text-primary)',
  },
};

const TroubleshootingList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      const matchSearch =
        searchQuery === '' || item.title.includes(searchQuery);
      const matchTab = activeTab === 'all' || item.status === activeTab;
      return matchSearch && matchTab;
    });
  }, [searchQuery, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const totalCount = MOCK_DATA.length;
  const resolvedCount = MOCK_DATA.filter(
    (i) => i.status === 'resolved',
  ).length;
  const inProgressCount = MOCK_DATA.filter(
    (i) => i.status === 'in_progress',
  ).length;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3)
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  return (
    <div
      style={{ backgroundColor: 'var(--color-background)' }}
      className="min-h-screen"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {/* 헤더 + 검색 + 필터 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              트러블슈팅 현황
            </h1>
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60 pl-10 pr-4 py-2 rounded-xl border text-sm outline-none"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            />
          </div>
        </div>

        {/* 통계 뱃지 (필터 역할) */}
        <div className="flex gap-3 mb-6">
          {([
            { key: 'all' as FilterTab, label: `총 ${totalCount}건`, style: BADGE_STYLES.all },
            { key: 'resolved' as FilterTab, label: `해결완료 ${resolvedCount}`, style: BADGE_STYLES.resolved },
            { key: 'in_progress' as FilterTab, label: `진행중 ${inProgressCount}`, style: BADGE_STYLES.in_progress },
          ]).map((badge) => (
            <button
              key={badge.key}
              onClick={() => setActiveTab(badge.key)}
              className="px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  activeTab === badge.key ? badge.style.bg : 'var(--color-surface)',
                color:
                  activeTab === badge.key
                    ? badge.style.border
                    : 'var(--color-text-primary)',
                border:
                  activeTab === badge.key
                    ? `2px solid ${badge.style.border}`
                    : '2px solid var(--color-border)',
              }}
            >
              {badge.label}
            </button>
          ))}
        </div>

        {/* 카드 리스트 */}
        <div ref={listRef} className="flex flex-col gap-4">
          {paginated.length > 0 ? (
            paginated.map((item) => (
              <TroubleshootingCard key={item.id} item={item} />
            ))
          ) : (
            <p
              className="text-center py-12 text-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              검색 결과가 없습니다.
            </p>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-10">
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary disabled:opacity-30"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path
                  d="M7 1L1 7L7 13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {getPageNumbers().map((page, idx) =>
              page === '...' ? (
                <span
                  key={`e-${idx}`}
                  className="w-9 h-9 flex items-center justify-center text-text-tertiary text-sm font-bold"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page as number)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm transition-all ${
                    currentPage === page
                      ? 'text-[#2d2a24] shadow-[0px_2px_8px_0px_rgba(245,200,66,0.4)]'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={
                    currentPage === page
                      ? { backgroundColor: '#F7C948' }
                      : {}
                  }
                >
                  {page}
                </button>
              ),
            )}
            <button
              onClick={() =>
                goToPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary disabled:opacity-30"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path
                  d="M1 1L7 7L1 13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TroubleshootingList;
