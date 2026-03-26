import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Container from '../common/Container';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 relative z-0">
        <Container className="py-8">
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default Layout;
