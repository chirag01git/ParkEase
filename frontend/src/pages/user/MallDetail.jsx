import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMallByIdApi, getSlotsApi } from '../../api/services';
import SlotGrid from '../../components/SlotGrid';
import StatusBadge from '../../components/StatusBadge';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';

const MallDetail = () => {
  const { id } = useParams();
  const [mall, setMall] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMallData();
  }, [id]);

  const fetchMallData = async () => {
    try {
      const [mallRes, slotsRes] = await Promise.all([getMallByIdApi(id), getSlotsApi(id)]);
      if (mallRes.data.success) setMall(mallRes.data.data.mall);
      if (slotsRes.data.success) setSlots(slotsRes.data.data.slots);
    } catch (err) {
      console.error('Failed to load mall details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading mall layout...</div>;
  if (!mall) return <div className="alert alert-danger">Mall not found.</div>;

  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <StatusBadge status={mall.status} />
              <span className="badge badge-available">{availableCount} Slots Available</span>
            </div>
            <h1 className="page-title">{mall.name}</h1>
            <p style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={16} color="#60a5fa" /> {mall.address}, {mall.city}
            </p>
          </div>

          <Link to={`/user/book/${mall._id}`} className="btn btn-primary">
            Proceed to Book Slot <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Real-time Parking Slots Overview</h3>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
          Green boxes indicate <strong style={{ color: '#34d399' }}>AVAILABLE</strong> slots ready for atomic reservation. Red boxes represent <strong style={{ color: '#f87171' }}>OCCUPIED</strong> slots.
        </p>

        <SlotGrid slots={slots} />
      </div>
    </div>
  );
};

export default MallDetail;
