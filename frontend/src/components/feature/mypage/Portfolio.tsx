import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionEmptyState } from '../../common';
import { getMyPortfolios, type PortfolioSummary } from '../../../api/portfolio';

// ── 날짜 포맷 ────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};

// ── 포트폴리오 카드 ────────────────────────────────────────────────────────────
const PortfolioCard = ({ item }: { item: PortfolioSummary }) => (
  <button
    type="button"
    onClick={() => {
      if (item.s3Url) window.open(item.s3Url, '_blank', 'noopener,noreferrer');
    }}
    className="flex flex-col justify-between border-2 border-border rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer flex-1 min-h-[12rem] text-left"
  >
    <div className="flex flex-col gap-1">
      <h3 className="text-[14px] font-bold text-text-primary">{item.title}</h3>
      <p className="text-[12px] text-text-secondary">수정: {formatDate(item.updatedAt)}</p>
    </div>
  </button>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col justify-between border-2 border-border rounded-2xl p-5 flex-1 min-h-[12rem] animate-pulse">
    <div className="flex flex-col gap-1">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
    <div className="h-5 bg-gray-200 rounded w-12 mt-4" />
  </div>
);

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyPortfolios()
      .then(({ data }) => {
        const sorted = [...(data.data ?? [])].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setPortfolios(sorted);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
          <span>포트폴리오</span>
        </h2>
        <Link
          to="/mypage/portfolio"
          className="text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="포트폴리오 전체보기"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* 카드 그리드 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex gap-4 h-full">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : portfolios.length > 0 ? (
          <div className="flex flex-col flex-1 overflow-x-auto justify-between">
            <div className="flex gap-4 mb-3">
              {portfolios.map((item) => (
                <PortfolioCard key={item.portfolioId} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <SectionEmptyState message="등록된 포트폴리오가 없습니다." />
        )}
      </div>
    </div>
  );
};

export default Portfolio;
