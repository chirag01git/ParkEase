import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMallsApi, getAvailableSlotsApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { Building2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

const MallBrowse = () => {
  const [malls, setMalls] = useState([]);
  const [slotCounts, setSlotCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMalls();
  }, []);

  const fetchMalls = async () => {
    try {
      const res = await getMallsApi();
      if (res.data.success) {
        const approvedMalls = res.data.data.malls;
        setMalls(approvedMalls);

        // Fetch available slot counts for each mall
        const counts = {};
        await Promise.all(
          approvedMalls.map(async (m) => {
            try {
              const slotRes = await getAvailableSlotsApi(m._id);
              if (slotRes.data.success) {
                counts[m._id] = slotRes.data.data.count;
              }
            } catch (err) {
              counts[m._id] = 0;
            }
          })
        );
        setSlotCounts(counts);
      }
    } catch (err) {
      console.error('Failed to load malls', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Browse Approved Malls</h1>
        <p className="page-subtitle">Select a mall to view real-time available parking slots and book instantly</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading available malls...</div>
      ) : malls.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <Building2 size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
          <h3>No Approved Malls Available</h3>
          <p style={{ color: '#94a3b8' }}>Check back later once the administrator approves pending malls.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {malls.map((mall) => {
            const availCount = slotCounts[mall._id] !== undefined ? slotCounts[mall._id] : 0;
            return (
              <div key={mall._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <StatusBadge status={mall.status} />
                    <span className="badge badge-available">
                      {availCount} Slots Available
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                    {mall.name}
                  </h3>

                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    <MapPin size={15} color="#60a5fa" /> {mall.address}, {mall.city}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    Total Configured Slots: <strong>{mall.totalSlots}</strong>
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/user/malls/${mall._id}`} className="btn btn-outline" style={{ flex: 1 }}>
                    View Layout
                  </Link>
                  <Link to={`/user/book/${mall._id}`} className="btn btn-primary" style={{ flex: 1 }}>
                    Book Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MallBrowse;
