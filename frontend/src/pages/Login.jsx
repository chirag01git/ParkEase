import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Car, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'MALL_OWNER') navigate('/owner/dashboard');
      else if (user.role === 'GUARD') navigate('/guard/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', background: '#3b82f6', padding: '0.75rem', borderRadius: '14px', color: '#fff', marginBottom: '0.75rem' }}>
            <Car size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Welcome to ParkEase</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Sign in to manage & book parking slots</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="user@parkease.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick Demo Auto-Fill Credentials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => fillCredentials('user@parkease.com', 'User@123')}>
              User Demo
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => fillCredentials('guard@parkease.com', 'Guard@123')}>
              Guard Demo
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => fillCredentials('owner@parkease.com', 'Owner@123')}>
              Mall Owner Demo
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => fillCredentials('admin@parkease.com', 'Admin@123')}>
              Admin Demo
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Don't have an account? <Link to="/register" style={{ color: '#3b82f6', fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
