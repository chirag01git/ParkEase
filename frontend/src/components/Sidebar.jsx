import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Ticket,
  PlusCircle,
  CheckSquare,
  Users,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <aside
      style={{
        width: '240px',
        background: '#0f172a',
        borderRight: '1px solid #334155',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, paddingLeft: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
        Navigation ({user.role})
      </div>

      {/* USER NAV LINKS */}
      {user.role === 'USER' && (
        <>
          <NavLink to="/user/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <NavLink to="/user/malls" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Building2 size={18} /> Browse Malls
          </NavLink>

          <NavLink to="/user/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Ticket size={18} /> My Bookings
          </NavLink>
        </>
      )}

      {/* MALL OWNER NAV LINKS */}
      {user.role === 'MALL_OWNER' && (
        <>
          <NavLink to="/owner/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Owner Analytics
          </NavLink>

          <NavLink to="/owner/malls" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Building2 size={18} /> My Malls
          </NavLink>

          <NavLink to="/owner/create-mall" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <PlusCircle size={18} /> Add New Mall
          </NavLink>
        </>
      )}

      {/* GUARD NAV LINKS */}
      {user.role === 'GUARD' && (
        <>
          <NavLink to="/guard/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <QrCode size={18} /> Gate Verification
          </NavLink>
        </>
      )}

      {/* ADMIN NAV LINKS */}
      {user.role === 'ADMIN' && (
        <>
          <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> System Overview
          </NavLink>

          <NavLink to="/admin/approvals" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CheckSquare size={18} /> Mall Approvals
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} /> Manage Users
          </NavLink>
        </>
      )}

      <style>{`
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          background: #1e293b;
          color: #fff;
        }
        .sidebar-link.active {
          background: #3b82f6;
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
