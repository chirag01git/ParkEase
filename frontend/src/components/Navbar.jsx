import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Car, LogOut, User as UserIcon, Shield, Building, KeyRound } from 'lucide-react';
import StatusBadge from './StatusBadge';

const Navbar = () => {
  const { user, logout, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickLogin = async (email, password) => {
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'ADMIN') navigate('/admin/dashboard');
      else if (loggedUser.role === 'MALL_OWNER') navigate('/owner/dashboard');
      else if (loggedUser.role === 'GUARD') navigate('/guard/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      console.error('Quick login failed', err);
    }
  };

  return (
    <header
      style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{ background: '#3b82f6', padding: '0.5rem', borderRadius: '10px', display: 'flex', color: '#fff' }}>
          <Car size={24} />
        </div>
        <div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            Park<span style={{ color: '#3b82f6' }}>Ease</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginTop: '-4px', fontWeight: 600 }}>
            MALL PARKING SYSTEM
          </span>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user ? (
          <>
            {/* Role Demo Switcher Bar */}
            <div style={{ display: 'flex', gap: '0.4rem', background: '#0f172a', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center', marginRight: '0.25rem', fontWeight: 600 }}>
                Demo Switch:
              </span>
              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => handleQuickLogin('user@parkease.com', 'User@123')}>
                User
              </button>
              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => handleQuickLogin('guard@parkease.com', 'Guard@123')}>
                Guard
              </button>
              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => handleQuickLogin('owner@parkease.com', 'Owner@123')}>
                Owner
              </button>
              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => handleQuickLogin('admin@parkease.com', 'Admin@123')}>
                Admin
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                <StatusBadge status={user.role} />
              </div>
            </div>

            <button className="btn btn-danger" style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }} onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
