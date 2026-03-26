import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FilePlus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    className="flex flex-col justify-between border-2 border-border rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer flex-1 min-h-[10rem] text-left"
  >
    <div className="flex flex-col gap-1">
      <h3 className="text-[14px] font-bold text-text-primary">{item.title}</h3>
      <p className="text-[12px] text-text-secondary">수정: {formatDate(item.updatedAt)}</p>
    </div>
  </button>
);

// ── 새 포트폴리오 버튼 ─────────────────────────────────────────────────────────
const NewPortfolioButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/mypage/portfolio/new')}
      className="flex flex-col items-center justify-center gap-3 border-2 border-border rounded-2xl p-5 hover:shadow-md hover:border-primary transition-all cursor-pointer flex-1 min-h-[10rem] text-text-tertiary hover:text-primary"
    >
      <FilePlus className="w-6 h-6" />
      <span className="text-[12px] font-bold">새 포트폴리오</span>
    </button>
  );
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col justify-between border-2 border-border rounded-2xl p-5 flex-1 min-h-[10rem] animate-pulse">
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
        setPortfolios(data.data ?? []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-text-primary" />
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
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex gap-4 h-full">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : portfolios.length > 0 ? (
          <div className="flex gap-4 max-h-[280px] overflow-x-auto scrollbar-hide">
            {portfolios.map((item) => (
              <PortfolioCard key={item.portfolioId} item={item} />
            ))}
            <NewPortfolioButton />
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            <NewPortfolioButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
