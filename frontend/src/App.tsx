import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
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
import MyProjects from './pages/MyProjects';
import { useAuthStore } from './stores/authStore';
import { getMe } from './api/user';

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
    if (searchParams.get('login') === null) return;

    const userId = searchParams.get('login') || '1';

    axios.get(`/api/v1/auth/test-login?userId=${userId}`)
      .then((res) => {
        const { accessToken, refreshToken } = res.data.data;
        setTokens(accessToken, refreshToken);
        return getMe();
      })
      .then((res) => {
        setUser(res.data);
        const url = new URL(window.location.href);
        url.searchParams.delete('login');
        window.history.replaceState(null, '', url.toString());
      })
      .catch((err) => {
        console.error('[test-login] 실패:', err);
      });
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
          <Route path="/my-projects" element={<MyProjects />} />
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