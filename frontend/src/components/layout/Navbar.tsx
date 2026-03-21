import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { logoutApi } from '../../api/user';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  deleteNotification as deleteNotifApi,
  deleteAllNotifications,
} from '../../api/notification';
import type { NotificationDto } from '../../api/notification';
import Container from '../common/Container';
import GitHubLoginButton from '../feature/auth/GitHubLoginButton';
import gguljobLogo from '../../assets/images/gguljob_logo.png';
import NotificationPanel from '../feature/notification/NotificationPanel';
import type { Notification } from '../feature/notification/NotificationPanel';

/** 백엔드 응답 → 프론트 Notification 변환 */
const toNotification = (dto: NotificationDto): Notification => {
  const now = Date.now();
  const created = new Date(dto.createdAt).getTime();
  const diffMin = Math.floor((now - created) / 60000);
  let time: string;
  if (diffMin < 1) time = '방금 전';
  else if (diffMin < 60) time = `${diffMin}분 전`;
  else if (diffMin < 1440) time = `${Math.floor(diffMin / 60)}시간 전`;
  else time = `${Math.floor(diffMin / 1440)}일 전`;

  return {
    id: dto.notificationId,
    type: dto.category,
    message: dto.content,
    time,
    isRead: dto.isRead,
    referenceId: dto.referenceId,
  };
};

const Navbar = ({ bgClassName = 'bg-background' }: { bgClassName?: string }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // 안 읽은 알림 개수 조회
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.data.count);
    } catch (err) {
      console.error('[알림] unread count 조회 실패:', err);
    }
  }, [isAuthenticated]);

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await getNotifications(0, 20);
      setNotifications(data.data.content.map(toNotification));
    } catch (err) {
      console.error('[알림] 목록 조회 실패:', err);
    }
  }, [isAuthenticated]);

  // 로그인 시 + 주기적으로 unread count 갱신
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // 알림 패널 열 때 목록 조회
  useEffect(() => {
    if (showNotification) fetchNotifications();
  }, [showNotification, fetchNotifications]);

  const handleDeleteNotif = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotifApi(id);
      fetchUnreadCount();
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkReadNotif = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await markNotificationRead(id);
      fetchUnreadCount();
    } catch {
      fetchNotifications();
    }
  };

  const handleClearAllNotifs = async () => {
    setNotifications([]);
    try {
      await deleteAllNotifications();
      setUnreadCount(0);
    } catch {
      fetchNotifications();
    }
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
    <header className={`sticky top-0 z-50 pt-1 ${bgClassName}`}>
      <Container className="h-16 flex items-center justify-between px-4">
        {/* 로고 */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={gguljobLogo} alt="꿀잡" className="h-26" />
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden lg:flex items-center justify-center gap-24 xl:gap-48 absolute left-1/2 -translate-x-[65%]">
          <Link to="/my-projects" onClick={() => window.scrollTo(0, 0)} className="text-text-primary hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors">
            내 프로젝트
          </Link>
          <Link to="/projects" onClick={() => window.scrollTo(0, 0)} className="text-text-primary hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors">
            프로젝트 찾기
          </Link>
          <Link to="/recruitment" onClick={() => window.scrollTo(0, 0)} className="text-text-primary hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors">
            채용
          </Link>
        </nav>

        {/* 데스크톱 우측 영역 */}
        <div className="hidden lg:flex items-center gap-6 ml-auto">
          {isAuthenticated ? (
            <div className="flex items-center gap-5">
              <div className="relative flex items-center" ref={notifRef}>
                <button
                  onClick={() => setShowNotification(prev => !prev)}
                  className="group relative p-2 rounded-lg text-icon hover:text-primary-hover hover:bg-primary-soft cursor-pointer transition-all"
                  aria-label="알림"
                >
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-error text-white text-[10px] font-bold leading-none">
                      {unreadCount}
                    </span>
                  )}
                  <span aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-md bg-text-primary text-white text-xs whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                    알림
                  </span>
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
              <Link to="/mypage" className="group relative p-2 rounded-lg text-icon hover:text-primary-hover hover:bg-primary-soft cursor-pointer transition-all" aria-label="마이페이지">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-md bg-text-primary text-white text-xs whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                  마이페이지
                </span>
              </Link>
              <button onClick={handleLogout} className="group relative p-2 rounded-lg text-icon hover:text-primary-hover hover:bg-primary-soft cursor-pointer transition-all" aria-label="로그아웃">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-md bg-text-primary text-white text-xs whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                  로그아웃
                </span>
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
        <div className="lg:hidden bg-white border-t border-primary/20 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/my-projects"
              onClick={() => { closeMobileMenu(); window.scrollTo(0, 0); }}
              className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
            >
              내 프로젝트
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
            {isAuthenticated ? (
              <div className="flex items-center justify-end gap-4">
                <div className="relative flex items-center" ref={notifRef}>
                  <button
                    onClick={() => setShowNotification(prev => !prev)}
                    className="relative text-icon hover:text-text-primary transition-colors"
                    aria-label="알림"
                  >
                    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-error text-white text-[10px] font-bold leading-none">
                        {unreadCount}
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
