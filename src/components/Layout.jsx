import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PageTransition from './PageTransition';

function Layout() {
  return (
    <>
      <Navbar />
      <main className="page-content">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <img
        src="/img/bg-character.webp"
        alt=""
        aria-hidden="true"
        className="bg-character"
      />
    </>
  );
}

export default Layout;
