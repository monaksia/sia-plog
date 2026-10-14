import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAuth, getToken } from '../api';

/**
 * 保护管理后台路由：未登录跳转到 /admin/login
 */
function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | ok | fail
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const expire = () => setStatus('fail');
    window.addEventListener('auth-expired', expire);
    if (!getToken()) setStatus('fail');
    else checkAuth().then(() => { if (active) setStatus('ok'); }).catch(() => { if (active) setStatus('fail'); });
    return () => { active = false; window.removeEventListener('auth-expired', expire); };
  }, []);

  if (status === 'loading') {
    return <div className="container"><p>Verifying...</p></div>;
  }
  if (status === 'fail') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

export default AdminGuard;
