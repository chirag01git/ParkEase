import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading session credentials...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'MALL_OWNER') return <Navigate to="/owner/dashboard" replace />;
    if (user.role === 'GUARD') return <Navigate to="/guard/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
