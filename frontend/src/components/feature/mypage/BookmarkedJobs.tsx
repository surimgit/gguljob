import { useState, useEffect } from 'react';
import { Bookmark, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionEmptyState } from '../../common';
import { getBookmarkedJobs, type BookmarkItem } from '../../../api/jobs';
import { calcDday, getDdayColor } from '../../../utils/dateUtils';

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface BookmarkedJob {
  id: number;
  title: string;
  company: string;
  deadline: string;
  deadlineColor: string;
  url: string | null;
}

// ── 북마크 아이템 카드 ─────────────────────────────────────────────────────────
const BookmarkJobItem = ({ job }: { job: BookmarkedJob }) => {
  const handleClick = () => {
    if (job.url) window.open(job.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter') handleClick(); }}
      className="flex flex-col gap-2 border-2 border-border rounded-2xl px-4 py-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="text-[14px] font-bold text-text-primary leading-snug">
        {job.title}
      </h3>
      <p className="text-[12px] text-text-secondary">{job.company}</p>
      {job.deadline && (
        <span
          className="self-start px-2 py-0.5 rounded-md text-[10px] font-bold"
          style={{ background: `${job.deadlineColor}18`, color: job.deadlineColor }}
        >
          {calcDday(job.deadline)}
        </span>
      )}
    </div>
  );
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const BookmarkedJobs = () => {
  const [jobs, setJobs] = useState<BookmarkedJob[]>([]);

  useEffect(() => {
    getBookmarkedJobs()
      .then(({ data }) => {
        const items: BookmarkItem[] = data.data?.content ?? [];
        const sorted = [...items].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        });
        setJobs(sorted.slice(0, 2).map((item) => ({
          id: item.jobId,
          title: item.title,
          company: item.companyName,
          deadline: item.deadline ?? '',
          deadlineColor: getDdayColor(calcDday(item.deadline ?? '')),
          url: item.url,
        })));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
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
      <div className="flex-1">
        {jobs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <BookmarkJobItem key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <SectionEmptyState message="북마크한 채용공고가 없습니다." />
        )}
      </div>
    </div>
  );
};

export default BookmarkedJobs;
