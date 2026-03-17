import JobRecommendHero from '../components/feature/recruitment/JobRecommendHero';
import JobListingSection from '../components/feature/recruitment/JobListingSection';

const Recruitment = () => {
  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <JobRecommendHero />
      <JobListingSection />
    </div>
  );
};

export default Recruitment;
