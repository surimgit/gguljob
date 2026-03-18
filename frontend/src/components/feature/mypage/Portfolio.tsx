import { useNavigate } from 'react-router-dom';
import { Briefcase, FilePlus } from 'lucide-react';
import { SectionEmptyState } from '../../common';

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface PortfolioItem {
  id: number;
  title: string;
  updatedAt: string;
  theme: string;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────
const MOCK_PORTFOLIOS: PortfolioItem[] = [
  {
    id: 1,
    title: '프론트엔드_2026',
    updatedAt: '2026.03.01',
    theme: '기본 테마',
  },
];

// ── 포트폴리오 카드 ────────────────────────────────────────────────────────────
const PortfolioCard = ({ item }: { item: PortfolioItem }) => (
  <div className="flex flex-col justify-between border-2 border-border rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer flex-1 min-h-[10rem]">
    <div className="flex flex-col gap-1">
      <h3 className="text-[14px] font-bold text-text-primary">{item.title}</h3>
      <p className="text-[12px] text-text-secondary">수정: {item.updatedAt}</p>
    </div>
    <span className="self-start mt-4 px-2.5 py-1 rounded-md text-[10px] text-text-secondary border border-border bg-[#f9fafb]">
      {item.theme}
    </span>
  </div>
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
const Portfolio = () => (
  <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
    {/* 섹션 헤더 */}
    <div className="flex items-center mb-6">
      <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-text-primary" />
        <span>포트폴리오</span>
      </h2>
    </div>

    {/* 카드 그리드 */}
    <div className="flex-1">
      {MOCK_PORTFOLIOS.length > 0 ? (
        <div className="flex gap-4 h-full">
          {MOCK_PORTFOLIOS.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
          <NewPortfolioButton />
        </div>
      ) : (
        <SectionEmptyState message="등록된 포트폴리오가 없습니다." />
      )}
    </div>
  </div>
);

export default Portfolio;
