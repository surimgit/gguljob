import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getJobs, toggleBookmark as toggleBookmarkApi, getBookmarkedJobs } from '../../../api/jobs';
import type { JobItem } from '../../../types/recruitment';
import { ROLE_LIST, ROLE_DISPLAY_NAMES, SKILLS_BY_CATEGORY, type RoleCode } from '../../../constants/skills';
import Pagination from '../../common/Pagination';
import { calcDday, getDdayColor } from '../../../utils/dateUtils';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type MatchType = 'suitable' | 'average' | 'insufficient';

interface JobListing {
  id: number;
  logoText: string;
  logoColor: string;
  company: string;
  isNew?: boolean;
  title: string;
  location: string;
  experience: string;
  employmentType: string;
  salary: string;
  deadline: string;
  url: string;
  match: MatchType;
  techStacks: string[];
  jobCategory: string;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

/** 백엔드 techStacks 파싱: `["[\"React\"", "\"Java\"]"]` → `["React", "Java"]` */
const parseTechStacks = (raw: string[] | undefined): string[] => {
  if (!raw || raw.length === 0) return [];
  const joined = raw.join(',');
  return joined
    .replace(/[\[\]"]/g, '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

/** 연봉 포맷: 숫자 범위에 "만원" 붙이기, 이미 단위 있으면 그대로 */
const formatSalary = (salary: string): string => {
  if (!salary) return '회사내규';
  if (/만원|원|억/.test(salary)) return salary;
  if (/\d/.test(salary)) return `${salary}만원`;
  return salary;
};

/** 크롤링 jobCategory(한글) → RoleCode 매핑 */
const JOB_CATEGORY_MAP: Record<string, RoleCode> = {
  '백엔드개발자': 'BACKEND',
  '프론트엔드개발자': 'FRONTEND',
  '웹개발자': 'FRONTEND',
  '앱개발자': 'MOBILE',
  '시스템엔지니어': 'DEVOPS',
  '네트워크엔지니어': 'DEVOPS',
  'DBA': 'DATABASE',
  '데이터엔지니어': 'DATA',
  '데이터사이언티스트': 'DATA',
  '보안엔지니어': 'DEVOPS',
  '소프트웨어개발자': 'BACKEND',
  '게임개발자': 'MOBILE',
  'AI/ML엔지니어': 'AI',
  '클라우드엔지니어': 'DEVOPS',
  'IT컨설팅': 'PM',
  'AI/ML연구원': 'AI',
  'AI서비스개발자': 'AI',
};

const mapJobCategory = (category: string): RoleCode | null => {
  if (!category) return null;
  return JOB_CATEGORY_MAP[category] ?? null;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────
const BACKEND_PAGE_SIZE = 10;

const SORT_OPTIONS = ['매칭순', '마감순'];

const MATCH_CONFIG: Record<MatchType, { label: string; bg: string; color: string }> = {
  suitable:     { label: '적합', bg: 'rgba(34,197,94,0.23)',  color: '#22C55E' },
  average:      { label: '보통', bg: '#FFF2C6',              color: '#F2B705' },
  insufficient: { label: '부족', bg: 'rgba(239,68,68,0.23)', color: '#EF4444' },
};

const MATCH_RANK: Record<MatchType, number> = { suitable: 3, average: 2, insufficient: 1 };

// ── 정렬 함수 ─────────────────────────────────────────────────────────────────
const sortJobs = (jobs: JobListing[], sort: string): JobListing[] => {
  const copy = [...jobs];
  if (sort === '매칭순') return copy.sort((a, b) => MATCH_RANK[b.match] - MATCH_RANK[a.match]);
  if (sort === '마감순') return copy.sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return copy;
};

// ── API 데이터 매핑 ────────────────────────────────────────────────────────────
const LOGO_COLORS = ['#F97316', '#00A63E', '#00D5BE', '#E7000B', '#155DFC', '#F2B705', '#8B5CF6', '#EC4899'];

const mapToJobListing = (item: JobItem): JobListing => ({
  id: item.jobId,
  logoText: item.companyName.charAt(0),
  logoColor: LOGO_COLORS[item.jobId % LOGO_COLORS.length],
  company: item.companyName,
  title: item.title,
  location: item.region,
  experience: item.experience,
  employmentType: item.contractType,
  salary: formatSalary(item.salary),
  deadline: item.deadline ?? '',
  url: item.url ?? '',
  match: item.matchStatus === '적합' ? 'suitable' : item.matchStatus === '보통' ? 'average' : 'insufficient',
  techStacks: parseTechStacks(item.techStacks),
  jobCategory: mapJobCategory(item.jobCategory ?? '') ?? '',
});


// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────
const BookmarkBtn = ({
  active,
  onClick,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button onClick={onClick} aria-label="북마크" className="flex-shrink-0">
    <svg
      className="w-5 h-5"
      fill={active ? '#F2B705' : 'none'}
      stroke={active ? '#F2B705' : '#9CA3AF'}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  </button>
);

function FilterButton({ text, selected, onClick }: { text: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        selected
          ? 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#111827] text-[13px] shadow-[0px_2px_8px_0px_rgba(245,200,66,0.3)] whitespace-nowrap transition-all'
          : 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#9ca3af] text-[13px] whitespace-nowrap hover:text-[#111827] transition-all'
      }
      style={
        selected
          ? { backgroundImage: 'linear-gradient(150.6deg, #F7C948 0%, #F2B705 100%)' }
          : {}
      }
    >
      {text}
    </button>
  );
}

const SkillCategoryFilter = ({
  activeCategory,
  activeSkill,
  onCategoryChange,
  onSkillChange,
}: {
  activeCategory: RoleCode | null;
  activeSkill: string;
  onCategoryChange: (category: RoleCode | null) => void;
  onSkillChange: (skill: string) => void;
}) => {
  const subSkills = activeCategory ? (SKILLS_BY_CATEGORY[activeCategory] ?? []) : [];
  const activeLabel = activeCategory ? ROLE_DISPLAY_NAMES[activeCategory] : null;

  return (
    <div className="flex flex-col gap-[8px]">
      {/* 카테고리 탭 */}
      <div className="flex items-start min-h-[32px] relative w-full">
        <span className="font-bold text-[#111827] text-[13px] leading-[31.5px] w-[56px] shrink-0">
          기술스택
        </span>
        <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px]">
          <FilterButton
            text="전체"
            selected={activeCategory === null && activeSkill === '전체'}
            onClick={() => { onCategoryChange(null); onSkillChange('전체'); }}
          />
          {ROLE_LIST.map((role) => (
            <FilterButton
              key={role}
              text={ROLE_DISPLAY_NAMES[role]}
              selected={activeCategory === role}
              onClick={() => {
                if (activeCategory === role) {
                  onCategoryChange(null);
                  onSkillChange('전체');
                } else {
                  onCategoryChange(role);
                  onSkillChange('전체');
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* 선택된 카테고리의 스킬 목록 */}
      {activeCategory && subSkills.length > 0 && (
        <>
          <div className="ml-[68px] border-t border-dashed border-[#e0d3b8]" />
          <div className="flex items-start min-h-[32px] relative w-full">
            <span className="font-bold text-[#b8a88a] text-[12px] leading-[31.5px] w-[56px] shrink-0 text-right pr-[4px]">
              {activeLabel}
            </span>
            <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px]">
              <FilterButton
                text="전체"
                selected={activeSkill === '전체'}
                onClick={() => onSkillChange('전체')}
              />
              {subSkills.map((skill) => (
                <FilterButton
                  key={skill}
                  text={skill}
                  selected={activeSkill === skill}
                  onClick={() => onSkillChange(skill)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const JobCard = ({
  job,
  bookmarked,
  onToggleBookmark,
}: {
  job: JobListing;
  bookmarked: boolean;
  onToggleBookmark: (id: number) => void;
}) => {
  const match = MATCH_CONFIG[job.match];
  const dday = calcDday(job.deadline);
  const ddayColor = getDdayColor(dday);

  const handleClick = () => {
    if (job.url) window.open(job.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${job.company} - ${job.title}`}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter') handleClick(); }}
      className="flex items-center gap-5 bg-white border-2 border-border rounded-[19px] px-5 py-4 shadow-[2px_2px_2px_0px_rgba(229,231,235,0.5)] hover:bg-primary-soft hover:border-primary-hover hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* 로고 */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-[15px] font-extrabold text-white"
        style={{ width: '57px', height: '57px', background: job.logoColor, fontSize: '23px' }}
      >
        {job.logoText}
      </div>

      {/* 공고 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13px] font-bold text-text-secondary">{job.company}</span>
          {job.isNew && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-[4px] bg-primary-soft text-text-brown">
              NEW
            </span>
          )}
          {dday && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full -translate-y-px"
              style={{ background: `${ddayColor}18`, color: ddayColor }}
            >
              {dday}
            </span>
          )}
        </div>
        <p className="text-[17px] font-extrabold text-text-primary mb-1 truncate">{job.title}</p>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary flex-wrap">
          <span>{job.location}</span>
          <span>·</span>
          <span>{job.experience}</span>
          <span>·</span>
          <span>{job.employmentType}</span>
          <span>·</span>
          <span className="font-bold text-primary-hover">{job.salary}</span>
        </div>
      </div>

      {/* 매칭 뱃지 + 북마크 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="text-[12px] font-bold px-3 py-1 rounded-full"
          style={{ background: match.bg, color: match.color }}
        >
          {match.label}
        </span>
        <BookmarkBtn
          active={bookmarked}
          onClick={e => {
            e.stopPropagation();
            onToggleBookmark(job.id);
          }}
        />
      </div>
    </div>
  );
};


// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const JobListingSection = () => {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<RoleCode | null>(null);
  const [activeSkill, setActiveSkill] = useState('전체');
  const [activeSort, setActiveSort] = useState('매칭순');
  const [showBookmarked, setShowBookmarked] = useState(
    searchParams.get('filter') === 'bookmarked'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    getJobs({ page: currentPage })
      .then(({ data }) => {
        setJobs(data.map(mapToJobListing));
        setHasNextPage(data.length >= BACKEND_PAGE_SIZE);
      })
      .catch(() => {});
  }, [currentPage]);

  useEffect(() => {
    getBookmarkedJobs()
      .then(({ data }) => setBookmarkedIds(new Set(data.map(j => j.jobId))))
      .catch(() => {});
  }, []);

  const toggleBookmark = (id: number) => {
    toggleBookmarkApi(id).catch(() => {});
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 필터링 → 정렬 → 페이지네이션
  const jobsFilteredByStack = (() => {
    if (!activeCategory) return jobs;
    if (activeSkill !== '전체') {
      return jobs.filter(job => job.techStacks.includes(activeSkill));
    }
    // 카테고리 선택 시: jobCategory 일치 또는 해당 카테고리 스킬 보유
    const categorySkills = SKILLS_BY_CATEGORY[activeCategory] ?? [];
    return jobs.filter(job =>
      job.jobCategory === activeCategory ||
      job.techStacks.some(t => categorySkills.includes(t))
    );
  })();

  const finalFilteredJobs = showBookmarked
    ? jobsFilteredByStack.filter(job => bookmarkedIds.has(job.id))
    : jobsFilteredByStack;

  const sorted = sortJobs(finalFilteredJobs, activeSort);

  const handleCategoryChange = (category: RoleCode | null) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSkillChange = (skill: string) => {
    setActiveSkill(skill);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1) return;
    if (page > currentPage && !hasNextPage) return;
    setCurrentPage(page);
  };

  return (
    <div className="bg-background max-w-[1400px] mx-auto px-3">
      {/* 섹션 제목 */}
      <div className="px-[42px] pt-8 pb-5">
        <h2 className="font-semibold text-[25px]">
          <span className="text-text-primary">전체 </span>
          <span className="text-primary-hover">채용 정보</span>
        </h2>
      </div>

      {/* 필터 박스 */}
      <div className="px-[39px] pb-4">
        <div className="bg-[#f7f8fa] border-2 border-[#f2b705] rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.02)] px-[25px] pt-[20px] pb-[14px] flex flex-col gap-[12px]">
          <SkillCategoryFilter
            activeCategory={activeCategory}
            activeSkill={activeSkill}
            onCategoryChange={handleCategoryChange}
            onSkillChange={handleSkillChange}
          />

          <div className="bg-[#f2b705] h-px w-full" />

          {/* 정렬 + 북마크 */}
          <div className="flex items-start min-h-[32px] relative w-full">
            <span className="font-bold text-[#111827] text-[13px] leading-[31.5px] w-[56px] shrink-0">
              정렬
            </span>
            <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px]">
              <button
                onClick={() => setShowBookmarked(prev => !prev)}
                className={
                  showBookmarked
                    ? 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#111827] text-[13px] shadow-[0px_2px_8px_0px_rgba(245,200,66,0.3)] whitespace-nowrap transition-all flex items-center gap-1.5'
                    : 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#9ca3af] text-[13px] whitespace-nowrap hover:text-[#111827] transition-all flex items-center gap-1.5'
                }
                style={
                  showBookmarked
                    ? { backgroundImage: 'linear-gradient(150.6deg, #F7C948 0%, #F2B705 100%)' }
                    : {}
                }
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                북마크 ({bookmarkedIds.size})
              </button>
              {SORT_OPTIONS.map(option => (
                <FilterButton
                  key={option}
                  text={option}
                  selected={activeSort === option}
                  onClick={() => handleSortChange(option)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 공고 카드 목록 */}
      <div className="px-[39px] flex flex-col gap-4 pb-2">
        {sorted.length > 0 ? (
          sorted.map(job => (
            <JobCard
              key={job.id}
              job={job}
              bookmarked={bookmarkedIds.has(job.id)}
              onToggleBookmark={toggleBookmark}
            />
          ))
        ) : showBookmarked ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-[15px] font-bold text-text-secondary">북마크한 공고가 없습니다.</p>
            <p className="text-[13px] text-text-tertiary">관심 있는 공고를 북마크해 보세요.</p>
          </div>
        ) : (
          <p className="text-center text-text-secondary py-12 text-[15px]">
            해당 기술스택의 채용 공고가 없습니다.
          </p>
        )}
      </div>

      {/* 페이지네이션 — 항상 표시 */}
      <Pagination current={currentPage} hasNext={hasNextPage} onChange={handlePageChange} />
    </div>
  );
};

export default JobListingSection;
