import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      <header style={{ padding: '20px', background: '#eee' }}>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <Link to="/">🏠 홈</Link>
          <Link to="/login">🔑 로그인</Link>
        </nav>
      </header>
      
      {/* Outlet: 이 자리에 각 페이지(Home, Login)가 갈아끼워집니다 */}
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;