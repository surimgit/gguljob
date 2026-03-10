import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProjectFind from './pages/ProjectFind';
import Recruitment from './pages/Recruitment';
import MyPage from './pages/MyPage';
import ProjectDetail from './pages/ProjectDetail';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/projects" element={<ProjectFind />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;