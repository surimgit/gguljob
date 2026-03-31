import { useState, useEffect, useCallback, useMemo } from 'react';
import JobRecommendHero from '../components/feature/recruitment/JobRecommendHero';
import JobListingSection from '../components/feature/recruitment/JobListingSection';
import { getBookmarkedJobs, toggleBookmark as toggleBookmarkApi, getAllJobs, getJobs } from '../api/jobs';
import type { JobItem } from '../types/recruitment';

const Recruitment = () => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [initialJobs, setInitialJobs] = useState<JobItem[]>([]);
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [allJobsLoaded, setAllJobsLoaded] = useState(false);

  useEffect(() => {
    getBookmarkedJobs()
      .then(({ data }) => setBookmarkedIds(new Set(data.data?.content?.map(j => j.jobId) ?? [])))
      .catch(() => {});
  }, []);

  // 첫 페이지: 빠르게 먼저 렌더
  useEffect(() => {
    getJobs({ page: 0, size: 20 })
      .then(({ data }) => setInitialJobs(data.content))
      .catch(() => {});
  }, []);

  // 전체 목록: 백그라운드 로드 (필터링/정렬용)
  useEffect(() => {
    getAllJobs()
      .then(({ data }) => {
        setAllJobs(data);
        setAllJobsLoaded(true);
      })
      .catch(console.error);
  }, []);

  // TOP 3: 전체 로드 전엔 첫 페이지 상위 3개, 완료 후 실제 top3
  const top3Jobs = useMemo(() => {
    if (allJobsLoaded) {
      return [...allJobs]
        .sort((a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0))
        .slice(0, 3);
    }
    return initialJobs.slice(0, 3);
  }, [allJobs, allJobsLoaded, initialJobs]);

  const toggleBookmark = useCallback((id: number) => {
    toggleBookmarkApi(id).catch(() => {});
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <JobRecommendHero top3Jobs={top3Jobs} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
      <JobListingSection initialJobs={initialJobs} allJobs={allJobs} allJobsLoaded={allJobsLoaded} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
    </div>
  );
};

export default Recruitment;
