import { Link } from 'react-router-dom';
import Container from '../common/Container';

const Footer = () => {
  return (
    <footer className="bg-primary-hover py-12">
      <Container>
        {/* 상단: 링크 컬럼 */}
        <div className="flex gap-16 mb-10 ml-10">
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-bold text-text-primary mb-1">Service</span>
            <Link to="/my-projects" className="text-base text-text-brown hover:underline">
              Project
            </Link>
            <Link to="/projects" className="text-base text-text-brown hover:underline">
              Searching Project
            </Link>
            <Link to="/recruitment" className="text-base text-text-brown hover:underline">
              Job Matching
            </Link>
            <Link to="/mypage" className="text-base text-text-brown hover:underline">
              My Page
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-bold text-text-primary mb-1">Project</span>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-text-brown hover:underline"
            >
              About
            </a>
            <a
              href="#"
              className="text-base text-text-brown hover:underline"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-base text-text-brown hover:underline"
            >
              Github
            </a>
          </div>
        </div>

        {/* 하단: 대형 GGULJOB 텍스트 */}
        <div className="border-t border-primary-hover pt-6 text-center">
          <p
            className="font-extrabold tracking-tight leading-none text-text-brown"
            style={{ fontSize: 'clamp(6rem, 15vw, 18rem)' }}
          >
            GGULJOB
          </p>
          <p className="text-sm font-bold text-text-brown mt-4">
            © {new Date().getFullYear()} PROJECT GUIDE. THE ALL-IN-ONE PROJECT PLATFORM
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
