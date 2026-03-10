import { Link } from 'react-router-dom';
import Container from '../common/Container';
import GitHubLoginButton from '../feature/auth/GitHubLoginButton';
import gguljobLogo from '../../assets/images/gguljob_logo.png';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <Container className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <img src={gguljobLogo} alt="꿀잡" className="h-9" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/projects" className="text-gray-600 hover:text-cta font-medium">
              프로젝트
            </Link>
            <Link to="/projects?tab=find" className="text-gray-600 hover:text-cta font-medium">
              프로젝트 찾기
            </Link>
            <Link to="/recruitment" className="text-gray-600 hover:text-cta font-medium">
              채용
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {/* TODO: 검색 기능 구현 예정? 아닐수도? */}
            <input
              type="text"
              placeholder="Search"
              disabled
              className="w-48 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <GitHubLoginButton />
        </div>
      </Container>
    </header>
  );
};

export default Navbar;