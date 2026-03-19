import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getJobs, toggleBookmark as toggleBookmarkApi, getBookmarkedJobs, getJobFilters } from '../../../api/jobs';
import type { JobItem } from '../../../types/recruitment';

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
  salaryMax: number;
  deadline: string;
  match: MatchType;
  techStacks: string[];
}

// ── 상수 ──────────────────────────────────────────────────────────────────────
const JOBS_PER_PAGE = 5;

const DEFAULT_TECH_STACKS = [
  '전체', 'React', 'TypeScript', 'Next.js', 'GraphQL',
  'Spring Boot', 'MySQL', 'Kubernetes', 'Node.js', 'Redis',
  'Webpack', 'Jest', 'Kafka', 'Storybook', 'MobX', 'Emotion', 'AWS',
];

const SORT_OPTIONS = ['매칭순', '마감순', '연봉순'];

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
  if (sort === '연봉순') return copy.sort((a, b) => b.salaryMax - a.salaryMax);
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
  salary: item.salary,
  salaryMax: 0,
  deadline: item.deadline ?? '',
  match: item.matchStatus === '적합' ? 'suitable' : item.matchStatus === '보통' ? 'average' : 'insufficient',
  techStacks: [],
});

// ── 더미 데이터 (API 연결 전 fallback) ────────────────────────────────────────
const MOCK_JOBS: JobListing[] = [
  {
    id: 1,
    logoText: '당',
    logoColor: '#F97316',
    company: '당근',
    title: '프론트엔드 엔지니어 (웹)',
    location: '서울 서초구',
    experience: '신입·경력 1~3년',
    employmentType: '정규직',
    salary: '5,000~7,500만원',
    salaryMax: 7500,
    deadline: '2026-04-30',
    match: 'suitable',
    techStacks: ['React', 'TypeScript', 'Next.js'],
  },
  {
    id: 2,
    logoText: 'L',
    logoColor: '#00A63E',
    company: '라인',
    title: 'Web Frontend Developer',
    location: '경기 판교',
    experience: '경력 1~4년',
    employmentType: '정규직',
    salary: '5,000~7,000만원',
    salaryMax: 7000,
    deadline: '2026-04-15',
    match: 'average',
    techStacks: ['React', 'TypeScript', 'GraphQL', 'Webpack'],
  },
  {
    id: 3,
    logoText: 'B',
    logoColor: '#00D5BE',
    company: '배달의민족',
    title: 'React 프론트엔드 개발자',
    location: '서울 송파구',
    experience: '경력 1~3년',
    employmentType: '정규직',
    salary: '5,000~7,000만원',
    salaryMax: 7000,
    deadline: '2026-05-10',
    match: 'average',
    techStacks: ['React', 'TypeScript', 'Jest', 'Storybook'],
  },
  {
    id: 4,
    logoText: 'C',
    logoColor: '#E7000B',
    company: '쿠팡',
    isNew: true,
    title: 'Backend Engineer (Java/Spring)',
    location: '서울 송파구',
    experience: '경력 2~5년',
    employmentType: '정규직',
    salary: '6,000~9,000만원',
    salaryMax: 9000,
    deadline: '2026-03-31',
    match: 'insufficient',
    techStacks: ['Spring Boot', 'MySQL', 'Kubernetes', 'AWS'],
  },
  {
    id: 5,
    logoText: 'V',
    logoColor: '#155DFC',
    company: '비바리퍼블리카',
    title: 'Server Engineer (Spring Boot)',
    location: '서울 강남구',
    experience: '경력 3~7년',
    employmentType: '정규직',
    salary: '6,000~9,500만원',
    salaryMax: 9500,
    deadline: '2026-04-20',
    match: 'average',
    techStacks: ['Spring Boot', 'MySQL', 'Redis', 'Kafka', 'AWS'],
  },
  {
    id: 6,
    logoText: 'K',
    logoColor: '#F2B705',
    company: '카카오',
    title: 'Node.js 백엔드 개발자',
    location: '경기 성남시',
    experience: '경력 2~4년',
    employmentType: '정규직',
    salary: '5,500~8,000만원',
    salaryMax: 8000,
    deadline: '2026-04-25',
    match: 'average',
    techStacks: ['Node.js', 'TypeScript', 'MySQL', 'Redis'],
  },
];

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

const FilterPill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`h-[33px] px-4 rounded-full text-[13px] transition-colors whitespace-nowrap ${
      active
        ? 'bg-primary-hover text-text-primary font-bold border-0'
        : 'bg-background border-2 border-border text-text-secondary font-medium hover:border-primary-hover'
    }`}
  >
    {label}
  </button>
);

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

  return (
    <div className="flex items-center gap-5 bg-white border-2 border-border rounded-[19px] px-5 py-4 shadow-[2px_2px_2px_0px_rgba(229,231,235,0.5)] hover:border-primary-hover hover:shadow-md transition-all duration-200 cursor-pointer">
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

const Pagination = ({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-center gap-2 mt-8 pb-12">
    <button
      onClick={() => onChange(current - 1)}
      disabled={current === 1}
      className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary disabled:opacity-40 hover:bg-gray-100 disabled:hover:bg-transparent transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    {Array.from({ length: total }, (_, i) => i + 1).map(page => (
      <button
        key={page}
        onClick={() => onChange(page)}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold transition-colors ${
          page === current
            ? 'bg-primary-hover text-text-primary'
            : 'text-text-secondary hover:bg-gray-100'
        }`}
      >
        {page}
      </button>
    ))}

    <button
      onClick={() => onChange(current + 1)}
      disabled={current === total}
      className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary disabled:opacity-40 hover:bg-gray-100 disabled:hover:bg-transparent transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const JobListingSection = () => {
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('전체');
  const [activeSort, setActiveSort] = useState('매칭순');
  const [showBookmarked, setShowBookmarked] = useState(
    searchParams.get('filter') === 'bookmarked'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [jobs, setJobs] = useState<JobListing[]>(MOCK_JOBS);
  const [techStacks, setTechStacks] = useState<string[]>(DEFAULT_TECH_STACKS);

  useEffect(() => {
    getJobFilters()
      .then(({ data }) => {
        if (data.techStacks?.length > 0)
          setTechStacks(["전체", ...data.techStacks]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getJobs({ page: currentPage })
      .then(({ data }) => setJobs(data.map(mapToJobListing)))
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
  const jobsFilteredByStack =
    activeFilter === '전체'
      ? jobs
      : jobs.filter(job => job.techStacks.includes(activeFilter));

  const finalFilteredJobs = showBookmarked
    ? jobsFilteredByStack.filter(job => bookmarkedIds.has(job.id))
    : jobsFilteredByStack;

  const sorted = sortJobs(finalFilteredJobs, activeSort);

  const totalPages = Math.max(1, Math.ceil(sorted.length / JOBS_PER_PAGE));
  const pagedJobs = sorted;

  const handleFilterChange = (stack: string) => {
    setActiveFilter(stack);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="bg-background" style={{ width: '1103px', margin: '0 auto' }}>
      {/* 섹션 제목 */}
      <div className="px-[42px] pt-8 pb-5">
        <h2 className="font-semibold text-[25px]">
          <span className="text-text-primary">전체 </span>
          <span className="text-primary-hover">채용 정보</span>
        </h2>
      </div>

      {/* 기술스택 필터 */}
      <div className="px-[39px] pb-4">
        <div className="flex flex-wrap gap-2">
          {techStacks.map(stack => (
            <FilterPill
              key={stack}
              label={stack}
              active={activeFilter === stack}
              onClick={() => handleFilterChange(stack)}
            />
          ))}
        </div>
      </div>

      {/* 정렬 + 북마크 버튼 */}
      <div className="flex items-center gap-2 px-[39px] pb-5">
        <button
          onClick={() => setShowBookmarked(prev => !prev)}
          className={`h-[33px] px-4 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-colors ${
            showBookmarked
              ? 'bg-primary-hover text-text-primary border-0'
              : 'bg-background border-2 border-primary-hover text-text-primary'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          북마크 ({bookmarkedIds.size})
        </button>
        {SORT_OPTIONS.map(option => (
          <FilterPill
            key={option}
            label={option}
            active={activeSort === option}
            onClick={() => handleSortChange(option)}
          />
        ))}
      </div>

      {/* 공고 카드 목록 */}
      <div className="px-[39px] flex flex-col gap-4 pb-2">
        {pagedJobs.length > 0 ? (
          pagedJobs.map(job => (
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
      <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
    </div>
  );
};

export default JobListingSection;