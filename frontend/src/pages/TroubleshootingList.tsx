import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown } from 'lucide-react';
import TroubleshootingCard from '../components/feature/troubleshooting/TroubleshootingCard';
import type { TroubleshootingCardItem } from '../components/feature/troubleshooting/TroubleshootingCard';
import Pagination from '../components/common/Pagination';
import { getMyTroubleshootings } from '../api/troubleshooting';

const ITEMS_PER_PAGE = 5;

const TroubleshootingList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState('전체');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [items, setItems] = useState<TroubleshootingCardItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 디바운스된 검색어
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색어/필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, projectFilter]);

  // API 호출
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getMyTroubleshootings(currentPage - 1, ITEMS_PER_PAGE);
        const body = (res.data as any)?.data ?? res.data;
        const mapped: TroubleshootingCardItem[] = (body.content ?? []).map((item: any) => ({
          id: item.tsId,
          title: item.title,
          description: item.description ?? '',
          solution: item.solution ?? null,
          codeSnippet: item.codeSnippet ?? null,
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.\s*/g, '.').replace(/\.$/, '') : '',
          projectId: item.projectId,
          projectName: item.projectName ?? '',
        }));
        setItems(mapped);
        setTotalPages(body.totalPages ?? 0);
        setTotalElements(body.totalElements ?? 0);
      } catch (err) {
        console.error('트러블슈팅 목록 조회 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  // 프로젝트 목록 추출
  const projectNames = useMemo(() => {
    const names = new Set(items.map((i) => i.projectName));
    return ['전체', ...Array.from(names)];
  }, [items]);

  // 클라이언트 사이드 필터 (검색 + 프로젝트)
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !debouncedSearch || item.title.includes(debouncedSearch) || item.description.includes(debouncedSearch);
      const matchProject = projectFilter === '전체' || item.projectName === projectFilter;
      return matchSearch && matchProject;
    });
  }, [items, debouncedSearch, projectFilter]);

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
        {/* 헤더 + 검색 */}
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
              placeholder="트러블슈팅 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60 pl-10 pr-4 py-2 rounded-xl border text-base outline-none"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            />
          </div>
        </div>

        {/* 프로젝트 드롭다운 + 총 건수 */}
        <div className="flex items-center justify-between mb-6">
          {/* 프로젝트 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-base font-semibold transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              {projectFilter === '전체' ? '프로젝트 전체' : projectFilter}
              <ChevronDown className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <div
                className="absolute top-full mt-1 left-0 z-10 min-w-[180px] rounded-xl border shadow-lg py-1"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                {projectNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setProjectFilter(name); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-base hover:bg-primary-soft transition-colors"
                    style={{
                      color: projectFilter === name ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontWeight: projectFilter === name ? 700 : 400,
                    }}
                  >
                    {name === '전체' ? '프로젝트 전체' : name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 총 건수 (회색 텍스트) */}
          <span className="text-base text-text-tertiary">
            총 {totalElements}건
          </span>
        </div>

        {/* 카드 리스트 */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p className="text-center py-12 text-base" style={{ color: 'var(--color-text-tertiary)' }}>
              불러오는 중...
            </p>
          ) : filtered.length > 0 ? (
            filtered.map((item) => (
              <TroubleshootingCard key={item.id} item={item} />
            ))
          ) : (
            <p
              className="text-center py-12 text-base"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {totalElements === 0 ? '트러블슈팅이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          )}
        </div>

        {/* 페이지네이션 */}
        <Pagination current={currentPage} totalPages={totalPages} onChange={goToPage} className="py-10" />
      </div>
    </div>
  );
};

export default TroubleshootingList;
