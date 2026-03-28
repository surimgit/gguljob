import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FilePlus, Briefcase, Trash2, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyPortfolios, savePortfolioAsFile, deletePortfolioApi, updatePortfolioTitle, type PortfolioSummary } from '../api/portfolio';
import portfolioImg from '../assets/images/portfolio.png';
import BaseModal from '../components/common/BaseModal';

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

  const [deleteTarget, setDeleteTarget] = useState<PortfolioSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePortfolioApi(deleteTarget.portfolioId);
      setPortfolios((prev) => prev.filter((p) => p.portfolioId !== deleteTarget.portfolioId));
      toast.success('포트폴리오가 삭제되었습니다.');
      setDeleteTarget(null);
    } catch {
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
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
      {/* 히어로 배너 */}
      <div className="relative w-[calc(100%+32px)] sm:w-[calc(100%+48px)] lg:w-[calc(100%+64px)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <section
          data-navbar-hero
          className="overflow-hidden bg-primary-soft/[0.36]"
          style={{ height: '380px' }}
        >
          <div className="max-w-[1400px] mx-auto pr-4 sm:pr-6 lg:pr-8 flex flex-col justify-center pt-13 pb-14 pl-[8%]">
            <h1
              className="font-bold"
              style={{ fontSize: '40px', color: '#111827', lineHeight: '1.35' }}
            >
              내 포트폴리오
            </h1>
            <p
              className="mt-4 mb-2"
              style={{ fontSize: '22px', color: '#4A5565' }}
            >
              AI가 생성한 포트폴리오를 관리하세요
            </p>

            {/* 새 포트폴리오 버튼 + 최신 포트폴리오 카드 */}
            <div className="flex gap-4 mt-4 items-stretch">
              {/* 새 포트폴리오 만들기 버튼 */}
              <button
                type="button"
                onClick={() => navigate('/mypage/portfolio/new')}
                className="rounded-[16px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer w-[220px] h-[170px] flex-shrink-0 transition-all duration-300 hover:border-[#6366f1] hover:shadow-md text-text-tertiary hover:text-[#6366f1]"
              >
                <FilePlus className="w-8 h-8" />
                <span className="text-sm font-bold">
                  새 포트폴리오 만들기
                </span>
              </button>

              {/* 최신 포트폴리오 카드 */}
              {!isLoading && portfolios.length > 0 && portfolios.slice(0, 2).map((latest) => (
                <div
                  key={latest.portfolioId}
                  className="bg-surface border-2 border-border rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] w-[220px] h-[170px] flex-shrink-0 cursor-pointer text-left transition-all duration-300 hover:scale-[1.06] hover:shadow-[0px_12px_32px_0px_rgba(0,0,0,0.14)] p-4 flex flex-col"
                  onClick={() => {
                    if (latest.s3Url) window.open(latest.s3Url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <div className="-ml-1 self-start rounded-[8px] px-[8px] py-[2px] bg-[rgba(99,102,241,0.12)]">
                    <p className="text-sm font-semibold leading-[15px]" style={{ color: '#6366f1' }}>
                      최근 포트폴리오
                    </p>
                  </div>
                  <div className="mt-4 flex-1 flex flex-col">
                    <p className="font-semibold text-text-primary text-base leading-[20px] break-words line-clamp-2">
                      {latest.title}
                    </p>
                    <p className="text-[12px] text-text-tertiary mt-auto pt-3">
                      수정: {formatDate(latest.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <img
          src={portfolioImg}
          alt="포트폴리오"
          className="absolute right-[7%] top-[4%] hidden xl:block"
          style={{ width: '430px', height: 'auto', zIndex: 10 }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 mt-6">
        <p
          className="text-base mb-4"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          총 {portfolios.length}개 포트폴리오
        </p>

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
                      onClick={() => setDeleteTarget(item)}
                      className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold border border-red-200 bg-white hover:bg-red-50 transition-colors text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BaseModal
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        containerClassName="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6">
          <h2 className="text-lg font-bold text-text-primary mb-2">포트폴리오 삭제</h2>
          <p className="text-sm text-text-secondary mb-6">
            <span className="font-semibold text-text-primary">"{deleteTarget?.title}"</span>을(를) 삭제하시겠습니까?<br />
            삭제된 포트폴리오는 복구할 수 없습니다.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default PortfolioList;
