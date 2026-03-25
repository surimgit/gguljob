import { useState, useEffect, useRef } from 'react';
import ProjectCard from '../components/feature/project/ProjectCard';
import type { ProjectCardDto } from '../types/project';
import ProjectFilter from '../components/feature/project/ProjectFilter';
import AutoScrollCarousel from '../components/feature/project/AutoScrollCarousel';
import ProjectApplyModal from '../components/feature/project/ProjectApplyModal';
import { useProjects, useRecommendedProjects, useProjectFilters } from '../hooks/useProjects';
import Pagination from '../components/common/Pagination';
import teamBuildingImg from '../assets/images/feature_team_building.png';
const ITEMS_PER_PAGE = 9;

const ProjectFind = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [techFilter, setTechFilter] = useState('전체');
  const [domainFilter, setDomainFilter] = useState('전체');
  const [positionFilter, setPositionFilter] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<ProjectCardDto | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // 디바운스된 검색어
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, techFilter, domainFilter, positionFilter]);

  const { data: filters } = useProjectFilters();

  // API 쿼리 파라미터 구성 (label → backend value 변환)
  const params = {
    page: currentPage - 1,
    size: ITEMS_PER_PAGE,
    ...(debouncedSearch && { keyword: debouncedSearch }),
    ...(domainFilter !== '전체' && { domain: filters?.domainValueMap?.[domainFilter] ?? domainFilter }),
    ...(techFilter !== '전체' && { skill: techFilter }),
    ...(positionFilter !== '전체' && { position: filters?.roleValueMap?.[positionFilter] ?? positionFilter }),
  };

  const { data: pageData, isLoading, isError } = useProjects(params);
  const { data: recommendedProjects } = useRecommendedProjects();

  const projects = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  // 히어로 패럴렉스
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

  const goToPage = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const carouselProjects = recommendedProjects ?? [];

  return (
    <div className="bg-[#f7f8fa] min-h-screen -mt-8">

      {/* Hero 섹션 */}
      <section
        ref={heroRef}
        data-navbar-hero
        className="pt-[20px] pb-[48px] text-center overflow-hidden bg-primary-soft/[0.36]"
        style={{
          width: '100vw',
          height: '380px',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%) scale(1.08)',
          transformOrigin: 'center top',
          willChange: 'transform',
        }}
      >
        <div className="relative inline-flex items-end justify-center gap-1 mb-[20px]">
          <h1 className="font-bold text-[#111827] text-[40px] tracking-[-0.5px]">
            나에게 적합한 프로젝트를 추천해드려요
          </h1>
          <img
            src={teamBuildingImg}
            alt="팀 빌딩"
            className="hidden xl:block -mb-2 -ml-3"
            style={{ width: '100px', height: 'auto', transform: 'rotate(-12deg)' }}
          />
        </div>

        {carouselProjects.length > 0 && (
          <AutoScrollCarousel direction="left" cards={carouselProjects} onCardClick={setSelectedProject} />
        )}
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-[48px]">

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
          skillGroups={filters?.skillGroups}
          domainOptions={filters?.domains}
          positionOptions={filters?.roles}
        />

        {/* 결과 카운트 */}
        <p className="font-semibold text-text-secondary text-base mt-[40px] mb-[24px]">
          총 <span className="font-bold text-text-secondary">{totalElements}</span>개 프로젝트
        </p>

        {/* 로딩 */}
        {isLoading && (
          <p className="text-center text-[#8a8073] text-sm py-20">프로젝트를 불러오는 중...</p>
        )}

        {/* 에러 */}
        {isError && (
          <p className="text-center text-red-500 text-sm py-20">프로젝트를 불러오지 못했습니다.</p>
        )}

        {/* 빈 상태 */}
        {!isLoading && !isError && projects.length === 0 && (
          <p className="text-center text-[#8a8073] text-sm py-20">검색 결과가 없습니다.</p>
        )}

        {/* 카드 그리드 */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[16px] gap-y-[16px]">
          {projects.map((project) => (
            <ProjectCard key={project.projectId} project={project} onClick={setSelectedProject} />
          ))}
        </div>

        {/* 페이지네이션 */}
        <Pagination current={currentPage} totalPages={totalPages} onChange={goToPage} className="py-14" />

      </div>

      {selectedProject && (
        <ProjectApplyModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onApplied={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default ProjectFind;
