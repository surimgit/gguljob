import { Bookmark, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type DeadlineVariant = 'urgent' | 'normal' | 'open';

interface BookmarkedJob {
  id: number;
  title: string;
  company: string;
  deadline: string;       // 표시 텍스트 (예: 'D-3', '상시채용')
  deadlineVariant: DeadlineVariant;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────
const MOCK_BOOKMARKS: BookmarkedJob[] = [
  {
    id: 1,
    title: '프론트엔드 개발자 (React)',
    company: '토스 (Toss)',
    deadline: 'D-3',
    deadlineVariant: 'urgent',
  },
  {
    id: 2,
    title: '웹 프론트엔드 엔지니어',
    company: '네이버 (NAVER)',
    deadline: '상시채용',
    deadlineVariant: 'open',
  },
  {
    id: 3,
    title: '프론트엔드 개발자',
    company: '카카오 (Kakao)',
    deadline: 'D-14',
    deadlineVariant: 'normal',
  },
];

// ── 마감 배지 색상 ─────────────────────────────────────────────────────────────
const DEADLINE_CLASSES: Record<DeadlineVariant, string> = {
  urgent: 'bg-[#fef2f2] text-[#ef4444]',
  normal: 'bg-[#fefce8] text-[#ca8a04]',
  open:   'bg-[#f3f4f6] text-[#4b5563]',
};

// ── 북마크 아이템 카드 ─────────────────────────────────────────────────────────
const BookmarkItem = ({ job }: { job: BookmarkedJob }) => (
  <Link
    to={`/recruitment`}
    className="flex flex-col gap-2 border-2 border-border rounded-2xl px-4 py-4 hover:shadow-md transition-shadow"
  >
    <h3 className="text-[14px] font-bold text-text-primary leading-snug">
      {job.title}
    </h3>
    <p className="text-[12px] text-text-secondary">{job.company}</p>
    <span
      className={`self-start px-2 py-0.5 rounded-md text-[10px] font-bold ${DEADLINE_CLASSES[job.deadlineVariant]}`}
    >
      {job.deadline}
    </span>
  </Link>
);

// ── 빈 상태 ────────────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-tertiary">
    <Bookmark className="w-8 h-8 opacity-30" />
    <p className="text-sm">북마크한 채용공고가 없습니다.</p>
  </div>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const BookmarkedJobs = () => (
  <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full">
    {/* 섹션 헤더 */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-text-primary" />
        <span>북마크한 채용공고</span>
      </h2>
      <Link
        to="/recruitment?filter=bookmarked"
        className="text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="북마크 채용공고 전체보기"
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>

    {/* 북마크 목록 */}
    {MOCK_BOOKMARKS.length > 0 ? (
      <div className="flex flex-col gap-3">
        {MOCK_BOOKMARKS.slice(0, 2).map((job) => (
          <BookmarkItem key={job.id} job={job} />
        ))}
      </div>
    ) : (
      <EmptyState />
    )}
  </div>
);

export default BookmarkedJobs;
