import { useState, useEffect, useCallback } from 'react';
import JobRecommendHero from '../components/feature/recruitment/JobRecommendHero';
import JobListingSection from '../components/feature/recruitment/JobListingSection';
import { getBookmarkedJobs, toggleBookmark as toggleBookmarkApi } from '../api/jobs';

const Recruitment = () => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getBookmarkedJobs()
      .then(({ data }) => setBookmarkedIds(new Set(data.map(j => j.jobId))))
      .catch(() => {});
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
      <JobRecommendHero bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
      <JobListingSection bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
    </div>
  );
};

export default Recruitment;
