import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const MOCK_USER = {
  id: 1,
  name: '홍길동',
  email: 'test@test.com',
  profileImage: null,
  techStacks: ['React', 'TypeScript', 'Firebase'],
};

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, setTokens, logout } = useAuthStore();

  const handleMockLogin = () => {
    setTokens('mock-access-token', 'mock-refresh-token');
    setUser(MOCK_USER);
  };

  return (
    <div>
      <h1>메인 페이지입니다.</h1>
      {isAuthenticated ? (
        <button onClick={logout}>로그아웃 (테스트)</button>
      ) : (
        <button onClick={handleMockLogin}>로그인 (테스트)</button>
      )}
      <button onClick={() => navigate('/mypage')}>마이페이지 (테스트)</button>
    </div>
  );
};

export default Home;
