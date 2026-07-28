import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { setToken } from '../../api';
import './Admin.css';

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/admin/login');
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Sia Admin</h2>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/admin/photos" className={({ isActive }) => isActive ? 'active' : ''}>
            📷 Photos
          </NavLink>
          <NavLink to="/admin/movies" className={({ isActive }) => isActive ? 'active' : ''}>
            🎬 Movies
          </NavLink>
          <NavLink to="/admin/books" className={({ isActive }) => isActive ? 'active' : ''}>
            📚 Books
          </NavLink>
        </nav>
        <button className="admin-logout" onClick={handleLogout}>登出</button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
