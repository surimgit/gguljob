import { useState, useEffect, useCallback } from 'react';
import JobRecommendHero from '../components/feature/recruitment/JobRecommendHero';
import JobListingSection from '../components/feature/recruitment/JobListingSection';
import { getBookmarkedJobs, toggleBookmark as toggleBookmarkApi, getAllJobs } from '../api/jobs';
import type { JobItem } from '../types/recruitment';

const Recruitment = () => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [allJobsLoaded, setAllJobsLoaded] = useState(false);

  useEffect(() => {
    getBookmarkedJobs()
      .then(({ data }) => setBookmarkedIds(new Set(data.data?.content?.map(j => j.jobId) ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getAllJobs()
      .then(({ data }) => {
        setAllJobs(data);
        setAllJobsLoaded(true);
      })
      .catch(console.error);
  }, []);

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
      <JobRecommendHero allJobs={allJobs} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
      <JobListingSection allJobs={allJobs} allJobsLoaded={allJobsLoaded} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
    </div>
  );
};

export default Recruitment;
