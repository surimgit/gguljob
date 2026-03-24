import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FilePlus, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyPortfolios, savePortfolioAsFile, type PortfolioSummary } from '../api/portfolio';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};

const SkeletonCard = () => (
  <div className="flex items-center justify-between border-2 border-border rounded-2xl p-5 animate-pulse">
    <div className="flex flex-col gap-2 flex-1">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
    <div className="h-8 w-20 bg-gray-200 rounded-xl" />
  </div>
);

const PortfolioList = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    getMyPortfolios()
      .then(({ data }) => setPortfolios(data.data ?? []))
      .catch(() => toast.error('포트폴리오 목록을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownload = async (item: PortfolioSummary) => {
    setDownloadingId(item.portfolioId);
    try {
      await savePortfolioAsFile(item.portfolioId, `${item.title}.md`);
    } catch {
      toast.error('다운로드에 실패했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      style={{ backgroundColor: 'var(--color-background)' }}
      className="min-h-screen"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
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
              내 포트폴리오
            </h1>
          </div>
          <button
            onClick={() => navigate('/mypage/portfolio/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <FilePlus className="w-4 h-4" />
            새 포트폴리오
          </button>
        </div>

        {/* 목록 */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
              <Briefcase className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-base font-medium mb-1">아직 생성된 포트폴리오가 없습니다</p>
              <p className="text-sm">트러블슈팅을 선택하여 AI 포트폴리오를 만들어보세요</p>
            </div>
          ) : (
            portfolios.map((item) => (
              <div
                key={item.portfolioId}
                className="flex items-center justify-between border-2 border-border rounded-2xl p-5 bg-surface hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-[15px] font-bold text-text-primary">{item.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-text-secondary">수정: {formatDate(item.updatedAt)}</span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'var(--color-background)',
                      }}
                    >
                      {item.isPublic ? '공개' : '비공개'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  disabled={downloadingId === item.portfolioId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingId === item.portfolioId ? '다운로드 중...' : '다운로드'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioList;
