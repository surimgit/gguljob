import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMe } from '../../api/user';

const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(!isAuthenticated);

  useEffect(() => {
    // 이미 인증된 상태면 체크 불필요
    if (isAuthenticated) {
      setIsChecking(false);
      return;
    }

    // 쿠키로 인증 복구 시도
    getMe()
      .then((user) => {
        setUser(user);
        setIsChecking(false);
      })
      .catch(() => {
        setIsChecking(false);
      });
  }, [isAuthenticated, setUser]);

  // 인증 체크 중이면 로딩 표시
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
