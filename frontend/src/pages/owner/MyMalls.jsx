import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyMallsApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { Building2, MapPin, PlusCircle, Settings } from 'lucide-react';

const MyMalls = () => {
  const [malls, setMalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMalls();
  }, []);

  const fetchMalls = async () => {
    try {
      const res = await getMyMallsApi();
      if (res.data.success) {
        setMalls(res.data.data.malls);
      }
    } catch (err) {
      console.error('Failed to load my malls', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">My Registered Malls</h1>
          <p className="page-subtitle">Manage mall configurations, slot allocations, and review approval status</p>
        </div>
        <Link to="/owner/create-mall" className="btn btn-primary">
          <PlusCircle size={18} /> Add New Mall
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading malls...</div>
      ) : malls.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>No Malls Registered</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Register your first mall to get started.</p>
          <Link to="/owner/create-mall" className="btn btn-primary">
            Register Mall
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {malls.map((mall) => (
            <div key={mall._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <StatusBadge status={mall.status} />
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Configured Slots: {mall.totalSlots}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                  {mall.name}
                </h3>

                <p style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                  <MapPin size={15} color="#60a5fa" /> {mall.address}, {mall.city}
                </p>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', gap: '0.5rem' }}>
                <Link to={`/owner/slots/${mall._id}`} className="btn btn-outline" style={{ flex: 1 }}>
                  <Settings size={16} /> Manage Slots
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMalls;
