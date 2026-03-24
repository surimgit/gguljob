import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FilePlus, Briefcase, Trash2, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyPortfolios, savePortfolioAsFile, deletePortfolioApi, updatePortfolioTitle, type PortfolioSummary } from '../api/portfolio';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};

const SkeletonCard = () => (
  <div className="flex flex-col border-2 border-border rounded-2xl overflow-hidden animate-pulse p-5">
    <div className="flex flex-col gap-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
    <div className="flex gap-2 mt-4">
      <div className="h-8 bg-gray-200 rounded-xl flex-1" />
      <div className="h-8 w-10 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

const PortfolioList = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyPortfolios()
      .then(({ data }) => setPortfolios(data.data ?? []))
      .catch(() => toast.error('포트폴리오 목록을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

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

  const handleDelete = async (item: PortfolioSummary) => {
    if (!window.confirm(`"${item.title}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await deletePortfolioApi(item.portfolioId);
      setPortfolios((prev) => prev.filter((p) => p.portfolioId !== item.portfolioId));
      toast.success('포트폴리오가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const startEdit = (item: PortfolioSummary) => {
    setEditingId(item.portfolioId);
    setEditTitle(item.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const submitEdit = async (portfolioId: number) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    try {
      await updatePortfolioTitle(portfolioId, trimmed);
      setPortfolios((prev) =>
        prev.map((p) => (p.portfolioId === portfolioId ? { ...p, title: trimmed } : p))
      );
      toast.success('제목이 수정되었습니다.');
    } catch {
      toast.error('제목 수정에 실패했습니다.');
    } finally {
      setEditingId(null);
      setEditTitle('');
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
            {!isLoading && portfolios.length > 0 && (
              <span className="text-sm font-medium text-text-tertiary">{portfolios.length}개</span>
            )}
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

        {/* 카드 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Briefcase className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-base font-medium mb-1">아직 생성된 포트폴리오가 없습니다</p>
            <p className="text-sm">트러블슈팅을 선택하여 AI 포트폴리오를 만들어보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolios.map((item) => (
              <div
                key={item.portfolioId}
                className="flex flex-col border-2 border-border rounded-2xl overflow-hidden bg-surface hover:shadow-lg transition-shadow"
              >
                {/* 콘텐츠 */}
                <div className="flex flex-col gap-3 p-5 flex-1">
                  {/* 제목 */}
                  {editingId === item.portfolioId ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitEdit(item.portfolioId);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="text-[15px] font-bold text-text-primary border border-border rounded-lg px-2 py-1 outline-none flex-1 min-w-0"
                        style={{ backgroundColor: 'var(--color-background)' }}
                      />
                      <button
                        type="button"
                        onClick={() => submitEdit(item.portfolioId)}
                        className="p-1 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-1 rounded-lg hover:bg-gray-100 text-text-tertiary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <h3 className="text-[15px] font-bold text-text-primary leading-snug line-clamp-2 flex-1">{item.title}</h3>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-text-tertiary transition-colors flex-shrink-0 mt-0.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-[12px] text-text-tertiary">수정: {formatDate(item.updatedAt)}</span>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.portfolioId}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingId === item.portfolioId ? '다운로드 중...' : '다운로드'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold border border-red-200 bg-white hover:bg-red-50 transition-colors text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 새 포트폴리오 카드 */}
            <button
              onClick={() => navigate('/mypage/portfolio/new')}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-8 hover:border-[#6366f1] hover:shadow-md transition-all cursor-pointer text-text-tertiary hover:text-[#6366f1] min-h-[200px]"
            >
              <FilePlus className="w-8 h-8" />
              <span className="text-sm font-bold">새 포트폴리오 만들기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioList;
