import React, { useState, useEffect } from 'react';
import { getAdminDashboardApi } from '../../api/services';
import { Users, Building2, CheckSquare, DollarSign, Car, Ticket, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getAdminDashboardApi();
      if (res.data.success) {
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">System Admin Control Center</h1>
          <p className="page-subtitle">Platform-wide parking analytics and mall approvals queue (Promise.all optimized)</p>
        </div>
        <Link to="/admin/approvals" className="btn btn-primary">
          <CheckSquare size={18} /> Review Pending Malls
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading platform metrics...</div>
      ) : !stats ? (
        <div className="alert alert-danger">Failed to retrieve admin statistics.</div>
      ) : (
        <>
          <div className="grid-stats">
            <div className="stat-card">
              <div className="stat-icon success">
                <DollarSign />
              </div>
              <div>
                <div className="stat-value">₹{stats.totalRevenue}</div>
                <div className="stat-label">Total System Revenue</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon primary">
                <Users />
              </div>
              <div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning">
                <Building2 />
              </div>
              <div>
                <div className="stat-value">{stats.pendingMalls}</div>
                <div className="stat-label">Pending Mall Approvals</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon success">
                <Building2 />
              </div>
              <div>
                <div className="stat-value">{stats.approvedMalls}</div>
                <div className="stat-label">Approved Malls</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon primary">
                <Car />
              </div>
              <div>
                <div className="stat-value">{stats.totalSlots}</div>
                <div className="stat-label">Total Parking Slots</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon danger">
                <Car />
              </div>
              <div>
                <div className="stat-value">{stats.occupiedSlots}</div>
                <div className="stat-label">Occupied Slots</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning">
                <Ticket />
              </div>
              <div>
                <div className="stat-value">{stats.totalBookings}</div>
                <div className="stat-label">Total Bookings</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon success">
                <Ticket />
              </div>
              <div>
                <div className="stat-value">{stats.completedBookings}</div>
                <div className="stat-label">Completed Bookings</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/admin/approvals" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <CheckSquare size={18} /> Manage Mall Approvals ({stats.pendingMalls} Pending)
                </Link>

                <Link to="/admin/users" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <Users size={18} /> Manage System Users ({stats.totalUsers} Registered)
                </Link>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Backend Performance Note</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
                All dashboard count and aggregation queries execute concurrently using <strong style={{ color: '#38bdf8' }}>Promise.all()</strong> to optimize database throughput and minimize API response latency.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
