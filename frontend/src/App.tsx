import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProjectFind from './pages/ProjectFind';
import Recruitment from './pages/Recruitment';
import MyPage from './pages/MyPage';
import ProjectDetail from './pages/ProjectDetail';
import OAuthCallback from './pages/OAuthCallback';
import UserProfileTest from './pages/UserProfileTest';
import CreateProject from './pages/CreateProject';
import ProjectDashboard from './pages/ProjectDashboard';
import { useAuthStore } from './stores/authStore';

const MOCK_USER = {
  id: 1,
  name: '테스트 유저',
  email: 'test@example.com',
  profileImage: null,
  techStacks: ['React', 'TypeScript'],
  role: 'FE' as const,
};

// BrowserRouter 내부에서 navigate를 사용하기 위해 분리
const AppRoutes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (searchParams.get('login') !== null) {
      setTokens('mock-access-token', 'mock-refresh-token');
      setUser(MOCK_USER);
      // 파라미터 제거 후 현재 경로 유지
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      window.history.replaceState(null, '', url.toString());
    }
  }, [searchParams, setTokens, setUser]);

  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* 홈은 자체 Layout(Navbar+Footer) 포함 */}
      <Route path="/" element={<Home />} />

      <Route element={<Layout />}>
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        <Route path="/projects" element={<ProjectFind />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/user-profile-test" element={<UserProfileTest />} />

        {/* 로그인 필요 라우트 */}
        <Route element={<PrivateRoute />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/my-projects/:id" element={<ProjectDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;