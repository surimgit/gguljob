import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#FFF8F0] border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-[#111827]">
          꿀잡
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/projects" className="text-gray-600 hover:text-[#111827] font-medium">
            프로젝트 찾기
          </Link>
          <Link to="/recruitment" className="text-gray-600 hover:text-[#111827] font-medium">
            채용
          </Link>
          <Link to="/mypage" className="text-gray-600 hover:text-[#111827] font-medium">
            마이페이지
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
