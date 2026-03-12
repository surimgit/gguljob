import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { logoutApi } from '../../api/user';
import Container from '../common/Container';
import GitHubLoginButton from '../feature/auth/GitHubLoginButton';
import gguljobLogo from '../../assets/images/gguljob_logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      logout();
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <Container className="h-14 flex items-center justify-between" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
        <div className="flex items-center gap-70">
          <Link to="/" className="flex items-center">
            <img src={gguljobLogo} alt="꿀잡" className="h-16" />
          </Link>
          <nav className="flex items-center gap-30">
            <Link to="/projects" className="text-text-primary hover:text-text-primary font-medium text-sm">
              프로젝트
            </Link>
            <Link to="/projects?tab=find" className="text-text-primary hover:text-text-primary font-medium text-sm">
              프로젝트 찾기
            </Link>
            <Link to="/recruitment" className="text-text-primary hover:text-text-primary font-medium text-sm">
              채용
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-7">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
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
              className="w-40 pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none disabled:cursor-not-allowed"
            />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-6">
              {/* 알림 */}
              <button className="text-icon hover:text-text-primary transition-colors" aria-label="알림">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              {/* 프로필 */}
              <button className="text-icon hover:text-text-primary transition-colors" aria-label="프로필">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {/* 로그아웃 */}
              <button onClick={handleLogout} className="text-icon hover:text-text-primary transition-colors" aria-label="로그아웃">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <GitHubLoginButton />
          )}
        </div>
      </Container>
    </header>
  );
};

export default Navbar;
