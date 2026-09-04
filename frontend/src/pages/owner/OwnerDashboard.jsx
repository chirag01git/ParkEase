import React, { useState, useEffect } from 'react';
import { getMyMallsApi, getMallDashboardApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { Building2, DollarSign, CheckCircle2, Ticket, Car, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const OwnerDashboard = () => {
  const [malls, setMalls] = useState([]);
  const [selectedMallId, setSelectedMallId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMalls();
  }, []);

  useEffect(() => {
    if (selectedMallId) {
      fetchDashboard(selectedMallId);
    }
  }, [selectedMallId]);

  const fetchMalls = async () => {
    try {
      const res = await getMyMallsApi();
      if (res.data.success) {
        const myMalls = res.data.data.malls;
        setMalls(myMalls);
        if (myMalls.length > 0) {
          setSelectedMallId(myMalls[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load owner malls', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (mallId) => {
    try {
      const res = await getMallDashboardApi(mallId);
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load mall dashboard', err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Mall Owner Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time revenue, occupancy statistics, and slot performance (Promise.all optimized)</p>
        </div>
        <Link to="/owner/create-mall" className="btn btn-primary">
          <PlusCircle size={18} /> Register New Mall
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading owner statistics...</div>
      ) : malls.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <Building2 size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
          <h3>No Registered Malls Found</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Register your mall to start managing slots and receiving parking bookings.</p>
          <Link to="/owner/create-mall" className="btn btn-primary">
            Create First Mall
          </Link>
        </div>
      ) : (
        <>
          {/* Mall Selector Dropdown */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>Select Mall to Inspect:</label>
            <select
              className="form-control"
              value={selectedMallId}
              onChange={(e) => setSelectedMallId(e.target.value)}
              style={{ maxWidth: '400px' }}
            >
              {malls.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.status})
                </option>
              ))}
            </select>
          </div>

          {dashboardData && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{dashboardData.mall.name}</h2>
                <StatusBadge status={dashboardData.mall.status} />
              </div>

              {/* Stats Cards Grid */}
              <div className="grid-stats">
                <div className="stat-card">
                  <div className="stat-icon success">
                    <DollarSign />
                  </div>
                  <div>
                    <div className="stat-value">₹{dashboardData.stats.revenue}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon primary">
                    <Car />
                  </div>
                  <div>
                    <div className="stat-value">{dashboardData.stats.totalSlots}</div>
                    <div className="stat-label">Total Slots</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon success">
                    <CheckCircle2 />
                  </div>
                  <div>
                    <div className="stat-value">{dashboardData.stats.availableSlots}</div>
                    <div className="stat-label">Available Slots</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon danger">
                    <Car />
                  </div>
                  <div>
                    <div className="stat-value">{dashboardData.stats.occupiedSlots}</div>
                    <div className="stat-label">Occupied Slots</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon warning">
                    <Ticket />
                  </div>
                  <div>
                    <div className="stat-value">{dashboardData.stats.totalBookings}</div>
                    <div className="stat-label">Total Bookings</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link to={`/owner/slots/${selectedMallId}`} className="btn btn-outline">
                  Manage Parking Slots
                </Link>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OwnerDashboard;
