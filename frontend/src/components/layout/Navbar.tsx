import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { logoutApi } from '../../api/user';
import Container from '../common/Container';
import GitHubLoginButton from '../feature/auth/GitHubLoginButton';
import gguljobLogo from '../../assets/images/gguljob_logo.png';
import NotificationPanel, { INITIAL_NOTIFICATIONS } from '../feature/notification/NotificationPanel';
import type { Notification } from '../feature/notification/NotificationPanel';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleDeleteNotif = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkReadNotif = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotification(false);
      }
    };
    if (showNotification) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotification]);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <Container className="h-16 flex items-center justify-between px-4">
        {/* 로고 */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={gguljobLogo} alt="꿀잡" className="h-18" />
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden lg:flex items-center justify-center gap-12 xl:gap-30 absolute left-1/2 -translate-x-[65%]">
          <Link to="/my-projects" onClick={() => window.scrollTo(0, 0)} className="text-text-primary hover:text-text-secondary font-semibold text-[15px] whitespace-nowrap transition-colors">
            프로젝트
          </Link>
          <Link to="/projects" onClick={() => window.scrollTo(0, 0)} className="text-text-primary hover:text-text-secondary font-semibold text-[15px] whitespace-nowrap transition-colors">
            프로젝트 찾기
          </Link>
          <Link to="/recruitment" onClick={() => window.scrollTo(0, 0)} className="text-text-primary hover:text-text-secondary font-semibold text-[15px] whitespace-nowrap transition-colors">
            채용
          </Link>
        </nav>

        {/* 데스크톱 우측 영역 */}
        <div className="hidden lg:flex items-center gap-6 ml-auto">
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
            <input
              type="text"
              placeholder="Search"
              disabled
              className="w-40 pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-text-primary placeholder-text-tertiary focus:outline-none disabled:cursor-not-allowed"
            />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-5">
              <div className="relative flex items-center" ref={notifRef}>
                <button
                  onClick={() => setShowNotification(prev => !prev)}
                  className="relative text-icon hover:text-text-primary transition-colors"
                  aria-label="알림"
                >
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-error text-white text-[10px] font-bold leading-none">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                {showNotification && (
                  <NotificationPanel
                    notifications={notifications}
                    onDelete={handleDeleteNotif}
                    onMarkRead={handleMarkReadNotif}
                    onClearAll={handleClearAllNotifs}
                    onClose={() => setShowNotification(false)}
                  />
                )}
              </div>
              <Link to="/mypage" className="text-icon hover:text-text-primary transition-colors" aria-label="마이페이지">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <button onClick={handleLogout} className="text-icon hover:text-text-primary transition-colors" aria-label="로그아웃">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <GitHubLoginButton />
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="lg:hidden flex items-center justify-center w-10 h-10 text-icon hover:text-text-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </Container>

      {/* 모바일 메뉴 드롭다운 */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-t border-border shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/my-projects"
              onClick={() => { closeMobileMenu(); window.scrollTo(0, 0); }}
              className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
            >
              프로젝트
            </Link>
            <Link
              to="/projects"
              onClick={() => { closeMobileMenu(); window.scrollTo(0, 0); }}
              className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
            >
              프로젝트 찾기
            </Link>
            <Link
              to="/recruitment"
              onClick={() => { closeMobileMenu(); window.scrollTo(0, 0); }}
              className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
            >
              채용
            </Link>
          </div>

          <div className="px-4 py-3 border-t border-border">
            <div className="relative mb-3">
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
              <input
                type="text"
                placeholder="Search"
                disabled
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-text-primary placeholder-text-tertiary focus:outline-none disabled:cursor-not-allowed"
              />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <button className="text-icon hover:text-text-primary transition-colors" aria-label="알림">
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <Link to="/mypage" onClick={closeMobileMenu} className="text-icon hover:text-text-primary transition-colors" aria-label="마이페이지">
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="text-icon hover:text-text-primary transition-colors" aria-label="로그아웃">
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <GitHubLoginButton />
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
