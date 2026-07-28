import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <>
      <Navbar />
      <main className="page-content">
        <Outlet />
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
