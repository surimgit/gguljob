import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProjectFind from './pages/ProjectFind';
import Recruitment from './pages/Recruitment';
import MyPage from './pages/MyPage';
import OAuthCallback from './pages/OAuthCallback';
import CreateProject from './pages/CreateProject';
import ProjectDashboard from './pages/ProjectDashboard';
import MyProjects from './pages/MyProjects';
import MemberRecommend from './pages/MemberRecommend';
import TroubleshootingList from './pages/TroubleshootingList';
import PortfolioCreate from './pages/PortfolioCreate';
import PortfolioList from './pages/PortfolioList';
import ApplicationList from './pages/ApplicationList';
import Neo4jGraph from './pages/Neo4jGraph';
import Neo4jGraphCyber from './pages/Neo4jGraphCyber';
import Neo4jGraphGalaxy from './pages/Neo4jGraphGalaxy';
import Neo4jGraphGalaxy2D from './pages/Neo4jGraphGalaxy2D';
import Neo4jGraphGalaxy4 from './pages/Neo4jGraphGalaxy4';
import Neo4jGraphGalaxy5 from './pages/Neo4jGraphGalaxy5';
import ScrollToTop from './components/common/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { getMe } from './api/user';

// BrowserRouter 내부에서 navigate를 사용하기 위해 분리
const AppRoutes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  // 새로고침 시 쿠키 기반 인증 복구
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().setAuthLoading(false);
      return;
    }
    // 백도어 로그인 중이면 test-login effect가 auth를 처리하므로 스킵
    if (import.meta.env.VITE_ENABLE_TEST_LOGIN && searchParams.get('login') !== null) {
      return;
    }
    getMe()
      .then((user) => setUser(user))
      .catch(() => useAuthStore.getState().setAuthLoading(false));
  }, [setUser, searchParams]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate]);

  useEffect(() => {
    if (!import.meta.env.VITE_ENABLE_TEST_LOGIN) return;
    if (searchParams.get('login') === null) return;

    const userId = searchParams.get('login') || '1';

    axios.get(`/api/v1/auth/test-login?userId=${userId}`, { withCredentials: true })
      .then(() => getMe())
      .then((user) => {
        setUser(user);
        const url = new URL(window.location.href);
        url.searchParams.delete('login');
        window.history.replaceState(null, '', url.toString());
      })
      .catch((err) => {
        console.error('[test-login] 실패:', err);
      });
  }, [searchParams, setUser]);

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* 홈은 자체 Layout(Navbar+Footer) 포함 */}
      <Route path="/" element={<Home />} />
      <Route path="/graph" element={<Neo4jGraph />} />
      <Route path="/graph2" element={<Neo4jGraphCyber />} />
      <Route path="/graph3" element={<Neo4jGraphGalaxy />} />
      <Route path="/graph3-2d" element={<Neo4jGraphGalaxy2D />} />
      <Route path="/graph4" element={<Neo4jGraphGalaxy4 />} />
      <Route path="/graph5" element={<Neo4jGraphGalaxy5 />} />

      <Route element={<Layout />}>
        {/* 로그인 필요 라우트 */}
        <Route element={<PrivateRoute />}>
          <Route path="/projects" element={<ProjectFind />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/team-recommend/:projectId" element={<MemberRecommend />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/my-projects/:id" element={<ProjectDashboard />} />
          <Route path="/mypage/troubleshooting" element={<TroubleshootingList />} />
          <Route path="/mypage/portfolio" element={<PortfolioList />} />
          <Route path="/mypage/portfolio/new" element={<PortfolioCreate />} />
          <Route path="/mypage/applications" element={<ApplicationList />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />
    </BrowserRouter>
  );
}

export default App;