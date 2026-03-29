const PAGE_WINDOW = 5;

const NAV_BTN =
  "w-8 h-8 flex items-center justify-center rounded-full text-text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-default hover:bg-gray-100 disabled:hover:bg-transparent transition-colors";

interface PaginationProps {
  current: number;
  totalPages?: number;
  hasNext?: boolean;
  onChange: (page: number) => void;
  className?: string;
}

const Pagination = ({
  current,
  totalPages,
  hasNext,
  onChange,
  className = "mt-8 pb-12",
}: PaginationProps) => {
  const effectiveHasNext = hasNext ?? (totalPages != null && current < totalPages);
  const groupStart = Math.floor((current - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
  const groupEnd = groupStart + PAGE_WINDOW - 1;
  // >> 버튼: 다음 그룹의 첫 페이지가 totalPages를 넘으면 비활성화
  const hasNextGroup = totalPages != null ? groupEnd < totalPages : effectiveHasNext;

  const pages = totalPages != null
    ? Array.from({ length: PAGE_WINDOW }, (_, i) => groupStart + i).filter(p => p >= 1 && p <= totalPages)
    : Array.from({ length: PAGE_WINDOW }, (_, i) => groupStart + i).filter(p => p >= 1 && (effectiveHasNext || p <= current));

  if (totalPages != null && totalPages <= 1) return <div className={className} />;
  if (totalPages == null && !effectiveHasNext && current === 1) return <div className={className} />;

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* << 5페이지 뒤로 */}
      <button
        onClick={() => onChange(Math.max(1, groupStart - PAGE_WINDOW))}
        disabled={groupStart <= 1}
        className={NAV_BTN}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l-7-7 7-7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-7-7 7-7" />
        </svg>
      </button>

      {/* < 이전 */}
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={NAV_BTN}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호 */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold cursor-pointer transition-colors ${
            page === current
              ? 'bg-primary-hover text-text-primary'
              : 'text-text-secondary hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      {/* > 다음 */}
      <button
        onClick={() => onChange(current + 1)}
        disabled={!effectiveHasNext}
        className={NAV_BTN}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* >> 5페이지 앞으로 */}
      <button
        onClick={() => onChange(groupEnd + 1)}
        disabled={!hasNextGroup}
        className={NAV_BTN}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l7 7-7 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
