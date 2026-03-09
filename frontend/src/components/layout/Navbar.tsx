import { Link } from 'react-router-dom';
import Container from '../common/Container';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-gray-100 shadow-sm">
      <Container className="h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-cta">
          꿀잡
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/projects" className="text-gray-600 hover:text-cta font-medium">
            프로젝트 찾기
          </Link>
          <Link to="/recruitment" className="text-gray-600 hover:text-cta font-medium">
            채용
          </Link>
          <Link to="/mypage" className="text-gray-600 hover:text-cta font-medium">
            마이페이지
          </Link>
        </nav>
      </Container>
    </header>
  );
};

export default Navbar;
