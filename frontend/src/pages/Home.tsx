import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import FlowSection from '../components/home/FlowSection';
import KeyFeaturesSection from '../components/home/KeyFeaturesSection';

const Home = () => (
  <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFAEB' }}>
    <Navbar />
    <main className="flex-1 relative z-0">
      <HeroSection />
      <FlowSection />
      <KeyFeaturesSection />
    </main>
    <Footer />
  </div>
);

export default Home;
