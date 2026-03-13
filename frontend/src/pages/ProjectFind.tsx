import { useState, useMemo, useEffect, useRef } from 'react';
import ProjectCard from '../components/feature/project/ProjectCard';
import ProjectFilter from '../components/feature/project/ProjectFilter';
import AutoScrollCarousel from '../components/feature/project/AutoScrollCarousel';
import { mockProjects } from '../data/mockProjects';

const ITEMS_PER_PAGE = 9;

const ProjectFind = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [techFilter, setTechFilter] = useState('전체');
  const [domainFilter, setDomainFilter] = useState('전체');
  const [positionFilter, setPositionFilter] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const scale = Math.max(1, 1.08 - (scrollY / 400) * 0.08);
      heroRef.current.style.transform = `translateX(-50%) scale(${scale})`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProjects = useMemo(() => {
    return mockProjects.filter((project) => {
      const matchSearch =
        searchQuery === '' || project.title.includes(searchQuery);
      const matchTech =
        techFilter === '전체' || project.techStack.includes(techFilter);
      const matchDomain =
        domainFilter === '전체' || project.category === domainFilter;
      const matchPosition =
        positionFilter === '전체' ||
        (positionFilter === 'FE 모집중' &&
          project.slots.fe.current < project.slots.fe.total) ||
        (positionFilter === 'BE 모집중' &&
          project.slots.be.current < project.slots.be.total);

      return matchSearch && matchTech && matchDomain && matchPosition;
    });
  }, [searchQuery, techFilter, domainFilter, positionFilter]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, techFilter, domainFilter, positionFilter]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="bg-[#f7f8fa] min-h-screen -mt-8">

      {/* Hero 섹션 - full width */}
      <section
        ref={heroRef}
        className="pt-[64px] pb-[48px] text-center overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #FFF9F0, #FFF5E4)',
          width: '100vw',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%) scale(1.08)',
          transformOrigin: 'center top',
          willChange: 'transform',
        }}
      >
        <h1 className="font-black text-[#2d2a24] text-[36px] tracking-[-0.5px] mb-[12px]">
          프로젝트 찾기
        </h1>
        <p className="font-bold text-[#8a8073] text-[16px] mb-[48px]">
          다양한 프로젝트를 살펴보세요.
        </p>

        <div className="flex flex-col gap-[16px]">
          <AutoScrollCarousel direction="left" cards={mockProjects} />
          <AutoScrollCarousel direction="right" cards={mockProjects} />
        </div>
      </section>

      <div className="max-w-[1084px] mx-auto pt-[48px]">

        {/* 필터 */}
        <ProjectFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          techFilter={techFilter}
          domainFilter={domainFilter}
          positionFilter={positionFilter}
          onTechChange={setTechFilter}
          onDomainChange={setDomainFilter}
          onPositionChange={setPositionFilter}
        />

        {/* 결과 카운트 */}
        <p className="font-bold text-[#8a8073] text-[13px] mt-[32px] mb-[24px]">
          총 <span className="font-black text-[#2d2a24]">{filteredProjects.length}</span>개 프로젝트
        </p>

        {/* 카드 그리드 */}
        <div ref={gridRef} className="grid grid-cols-3 gap-x-[16px] gap-y-[16px]">
          {paginatedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-[8px] py-[56px]">
            {/* 이전 */}
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-[36px] h-[36px] flex items-center justify-center rounded-full text-[#9ca3af] hover:text-[#2d2a24] disabled:opacity-30 transition-colors"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* 페이지 번호 */}
            {getPageNumbers().map((page, idx) =>
              page === '...'
                ? (
                  <span key={`ellipsis-${idx}`} className="w-[36px] h-[36px] flex items-center justify-center text-[#9ca3af] text-[14px] font-bold">
                    ...
                  </span>
                )
                : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`w-[36px] h-[36px] flex items-center justify-center rounded-full font-bold text-[14px] transition-all duration-200 ${
                      currentPage === page
                        ? 'text-[#2d2a24] shadow-[0px_2px_8px_0px_rgba(245,200,66,0.4)]'
                        : 'text-[#6b7280] hover:text-[#2d2a24]'
                    }`}
                    style={currentPage === page ? { backgroundColor: '#F7C948' } : {}}
                  >
                    {page}
                  </button>
                )
            )}

            {/* 다음 */}
            <button
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-[36px] h-[36px] flex items-center justify-center rounded-full text-[#9ca3af] hover:text-[#2d2a24] disabled:opacity-30 transition-colors"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectFind;
