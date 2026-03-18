import { useState } from 'react';
import JobRecommendHero from '../components/feature/recruitment/JobRecommendHero';
import JobListingSection from '../components/feature/recruitment/JobListingSection';

const Recruitment = () => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set([1, 3, 6]));

  const toggleBookmark = (id: number) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <JobRecommendHero bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
      <JobListingSection bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />
    </div>
  );
};

export default Recruitment;
