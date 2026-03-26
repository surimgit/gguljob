import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
    actionStatus: dto.actionStatus ?? 'NONE',
    referenceId: dto.referenceId,
    referenceUrl: dto.referenceUrl?.replace(/^\/projects\/(\d+)/, '/my-projects/$1') ?? null,
  };
};

const Navbar = () => {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();
    const headerRef = useRef<HTMLElement>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadRef = useRef<number>(-1);
    const notifRef = useRef<HTMLDivElement>(null);

    // 안 읽은 알림 개수 조회
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await getUnreadCount();
            const newCount = data.data.count;
            // 첫 호출(-1)이 아닌 경우에만 토스트 표시
            if (prevUnreadRef.current >= 0 && newCount > prevUnreadRef.current) {
                const diff = newCount - prevUnreadRef.current;
                toast(`새 알림이 ${diff}건 도착했습니다.`, { icon: '🔔' });
            }
            prevUnreadRef.current = newCount;
            setUnreadCount(newCount);
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
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await deleteNotifApi(id);
            fetchUnreadCount();
        } catch {
            fetchNotifications();
        }
    };

    const handleMarkReadNotif = async (id: number) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
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

    // Escape 키로 로그아웃 확인 모달 닫기
    useEffect(() => {
        if (!showLogoutConfirm) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowLogoutConfirm(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [showLogoutConfirm]);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    /** 비로그인 시 라우팅 차단 → 메인 페이지로 이동 */
    const guardLink = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            toast('로그인이 필요한 서비스입니다.', { icon: '🔒' });
            navigate('/');
        }
    };

    const location = useLocation();

    // data-navbar-hero 속성을 가진 섹션의 배경색을 따라가고, 벗어나면 흰색
    useEffect(() => {
        let rafId: number;
        let lastHeroEl: Element | null = null;
        let heroColor: string | null = null;

        // 어떤 CSS 색상이든 bg-background 위에 합성한 불투명 RGB로 변환
        const toOpaqueRgb = (color: string): string => {
            const cv = document.createElement('canvas');
            cv.width = cv.height = 1;
            const ctx = cv.getContext('2d')!;
            ctx.fillStyle = '#F7F8FA'; // bg-background
            ctx.fillRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return `rgb(${r}, ${g}, ${b})`;
        };

        // data-navbar-hero 요소의 배경색 추출
        const extractColor = (el: Element): string | null => {
            const cs = getComputedStyle(el);
            const bg = cs.backgroundColor;
            if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return toOpaqueRgb(bg);
            return null;
        };

        const findHeroes = (): boolean => {
            const heroes = document.querySelectorAll('[data-navbar-hero]');
            if (heroes.length === 0) return false;
            heroColor = extractColor(heroes[0]);
            lastHeroEl = heroes[heroes.length - 1];
            return true;
        };

        const sync = () => {
            const hdr = headerRef.current;
            if (!hdr) return;
            if (!lastHeroEl || !heroColor) {
                hdr.style.backgroundColor = '#ffffff';
                return;
            }
            const heroBottom = lastHeroEl.getBoundingClientRect().bottom;
            const navBottom = hdr.getBoundingClientRect().bottom;
            hdr.style.backgroundColor = heroBottom > navBottom ? heroColor : '#ffffff';
        };

        const onScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(sync);
        };

        // hero 요소가 렌더링될 때까지 재시도
        let retryCount = 0;
        const tryInit = () => {
            requestAnimationFrame(() => {
                if (findHeroes()) {
                    sync();
                } else if (retryCount < 10) {
                    retryCount++;
                    setTimeout(tryInit, 100);
                }
            });
        };
        tryInit();

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', onScroll);
        };
    }, [location.pathname]);

    return (
        <header
            ref={headerRef}
            className="sticky top-0 z-50 pt-1 bg-background transition-[background-color] duration-300"
        >
            <Container className="h-16 flex items-center px-4 relative">
                {/* 로고 */}
                <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center shrink-0">
                    <img src={gguljobLogo} alt="꿀잡" className="h-26" />
                </Link>

                {/* 데스크톱 네비게이션 — 화면 정중앙 */}
                <nav className="hidden lg:flex items-center justify-center gap-12 xl:gap-16 absolute inset-0 pointer-events-none">
                    <div className="flex items-center justify-center gap-12 xl:gap-16 pointer-events-auto -ml-13">
                        <Link
                            to="/my-projects"
                            onClick={(e) => { guardLink(e); window.scrollTo(0, 0); }}
                            className="text-text-brown hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors"
                        >
                            내 프로젝트
                        </Link>
                        <Link
                            to="/projects"
                            onClick={(e) => { guardLink(e); window.scrollTo(0, 0); }}
                            className="text-text-brown hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors"
                        >
                            프로젝트 찾기
                        </Link>
                        <Link
                            to="/mypage/portfolio"
                            onClick={(e) => { guardLink(e); window.scrollTo(0, 0); }}
                            className="text-text-brown hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors"
                        >
                            포트폴리오
                        </Link>
                        <Link
                            to="/recruitment"
                            onClick={(e) => { guardLink(e); window.scrollTo(0, 0); }}
                            className="text-text-brown hover:text-primary-hover hover:underline hover:underline-offset-8 font-semibold text-base whitespace-nowrap transition-colors"
                        >
                            채용
                        </Link>
                    </div>
                </nav>

                {/* 데스크톱 우측 영역 */}
                <div className="hidden lg:flex items-center gap-6 ml-auto">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-5">
                            <div className="relative flex items-center" ref={notifRef}>
                                <button
                                    onClick={() => setShowNotification((prev) => !prev)}
                                    className="group relative p-2 rounded-lg text-text-brown hover:text-primary-hover hover:bg-primary-soft cursor-pointer transition-all"
                                    aria-label="알림"
                                >
                                    <svg
                                        className="w-[22px] h-[22px]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-error text-white text-[10px] font-bold leading-none">
                                            {unreadCount}
                                        </span>
                                    )}
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-md bg-text-brown text-white text-xs whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150"
                                    >
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
                            <Link
                                to="/mypage"
                                className="group relative p-2 rounded-lg text-text-brown hover:text-primary-hover hover:bg-primary-soft cursor-pointer transition-all"
                                aria-label="마이페이지"
                            >
                                <svg
                                    className="w-[22px] h-[22px]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-md bg-text-brown text-white text-xs whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150"
                                >
                                    마이페이지
                                </span>
                            </Link>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="group relative p-2 rounded-lg text-text-brown hover:text-primary-hover hover:bg-primary-soft cursor-pointer transition-all"
                                aria-label="로그아웃"
                            >
                                <svg
                                    className="w-[22px] h-[22px]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-md bg-text-brown text-white text-xs whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150"
                                >
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
                    className="lg:hidden ml-auto flex items-center justify-center w-10 h-10 text-icon hover:text-text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                >
                    {mobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    )}
                </button>
            </Container>

            {/* 모바일 메뉴 드롭다운 */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-background border-t border-primary/20 shadow-lg">
                    <div className="px-4 py-3 space-y-1">
                        <Link
                            to="/my-projects"
                            onClick={(e) => {
                                guardLink(e);
                                closeMobileMenu();
                                window.scrollTo(0, 0);
                            }}
                            className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
                        >
                            내 프로젝트
                        </Link>
                        <Link
                            to="/projects"
                            onClick={(e) => {
                                guardLink(e);
                                closeMobileMenu();
                                window.scrollTo(0, 0);
                            }}
                            className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
                        >
                            프로젝트 찾기
                        </Link>
                        <Link
                            to="/mypage/portfolio"
                            onClick={(e) => {
                                guardLink(e);
                                closeMobileMenu();
                                window.scrollTo(0, 0);
                            }}
                            className="block px-3 py-2.5 text-text-primary hover:bg-primary-soft rounded-lg font-medium text-sm transition-colors"
                        >
                            포트폴리오
                        </Link>
                        <Link
                            to="/recruitment"
                            onClick={(e) => {
                                guardLink(e);
                                closeMobileMenu();
                                window.scrollTo(0, 0);
                            }}
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
                                        onClick={() => setShowNotification((prev) => !prev)}
                                        className="relative text-icon hover:text-text-primary transition-colors"
                                        aria-label="알림"
                                    >
                                        <svg
                                            className="w-[22px] h-[22px]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
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
                                <Link
                                    to="/mypage"
                                    onClick={closeMobileMenu}
                                    className="text-icon hover:text-text-primary transition-colors"
                                    aria-label="마이페이지"
                                >
                                    <svg
                                        className="w-[22px] h-[22px]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </Link>
                                <button
                                    onClick={() => {
                                        setShowLogoutConfirm(true);
                                        closeMobileMenu();
                                    }}
                                    className="text-icon hover:text-text-primary transition-colors"
                                    aria-label="로그아웃"
                                >
                                    <svg
                                        className="w-[22px] h-[22px]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <GitHubLoginButton />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* 로그아웃 확인 모달 */}
            {showLogoutConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowLogoutConfirm(false)} />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
                        <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl pointer-events-auto text-center">
                            <div className="text-4xl mb-3">👋</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">로그아웃 하시겠습니까?</h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                다시 로그인하면 이전 데이터를 그대로 이용할 수 있습니다.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutConfirm(false);
                                        handleLogout();
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                                >
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
};

export default Navbar;
1;
