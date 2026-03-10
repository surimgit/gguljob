import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
import { useAuthStore } from './stores/authStore';

// BrowserRouter 내부에서 navigate를 사용하기 위해 분리
const AppRoutes = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate]);

  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route element={<Layout />}>
        {/* 공개 라우트 */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/projects" element={<ProjectFind />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/recruitment" element={<Recruitment />} />

        {/* 로그인 필요 라우트 */}
        <Route element={<PrivateRoute />}>
          <Route path="/mypage" element={<MyPage />} />
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