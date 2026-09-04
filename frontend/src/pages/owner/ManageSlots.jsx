import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMallByIdApi, getSlotsApi, createSlotsApi } from '../../api/services';
import SlotGrid from '../../components/SlotGrid';
import { ArrowLeft, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

const ManageSlots = () => {
  const { mallId } = useParams();
  const [mall, setMall] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single slot form
  const [singleSlotNum, setSingleSlotNum] = useState('');
  const [singleVehicleType, setSingleVehicleType] = useState('CAR');

  // Bulk slot form
  const [prefix, setPrefix] = useState('C-');
  const [startNum, setStartNum] = useState(1);
  const [count, setCount] = useState(5);
  const [bulkVehicleType, setBulkVehicleType] = useState('CAR');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [mallId]);

  const fetchData = async () => {
    try {
      const [mallRes, slotsRes] = await Promise.all([
        getMallByIdApi(mallId),
        getSlotsApi(mallId),
      ]);
      if (mallRes.data.success) setMall(mallRes.data.data.mall);
      if (slotsRes.data.success) setSlots(slotsRes.data.data.slots);
    } catch (err) {
      console.error('Failed to load slots data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSingle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await createSlotsApi(mallId, {
        slotNumber: singleSlotNum.trim(),
        vehicleType: singleVehicleType,
      });

      if (res.data.success) {
        setSuccess(`Slot '${singleSlotNum}' created successfully.`);
        setSingleSlotNum('');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBulk = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const generated = [];
    for (let i = 0; i < Number(count); i++) {
      const numStr = String(Number(startNum) + i).padStart(2, '0');
      generated.push({
        slotNumber: `${prefix}${numStr}`,
        vehicleType: bulkVehicleType,
      });
    }

    try {
      const res = await createSlotsApi(mallId, { slots: generated });
      if (res.data.success) {
        setSuccess(`Batch of ${generated.length} slots created successfully.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading slots configuration...</div>;
  if (!mall) return <div className="alert alert-danger">Mall not found.</div>;

  return (
    <div>
      <Link to="/owner/malls" className="btn btn-outline" style={{ marginBottom: '1.25rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Back to My Malls
      </Link>

      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ fontSize: '1.4rem' }}>{mall.name} – Slot Management</h2>
        <p className="page-subtitle">Configure parking slots and view real-time layout</p>

        {error && <div className="alert alert-danger"><AlertCircle size={18} /> {error}</div>}
        {success && <div className="alert alert-success"><CheckCircle2 size={18} /> {success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          {/* Single Slot Form */}
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>Add Single Slot</h4>
            <form onSubmit={handleCreateSingle}>
              <div className="form-group">
                <label className="form-label">Slot Number Identifier</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. C-101"
                  value={singleSlotNum}
                  onChange={(e) => setSingleSlotNum(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-control" value={singleVehicleType} onChange={(e) => setSingleVehicleType(e.target.value)}>
                  <option value="CAR">CAR</option>
                  <option value="BIKE">BIKE</option>
                  <option value="ANY">ANY (Universal)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                <PlusCircle size={16} /> Add Slot
              </button>
            </form>
          </div>

          {/* Bulk Slots Form */}
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>Bulk Batch Slot Generation</h4>
            <form onSubmit={handleCreateBulk}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Prefix</label>
                  <input type="text" className="form-control" value={prefix} onChange={(e) => setPrefix(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Start #</label>
                  <input type="number" className="form-control" value={startNum} onChange={(e) => setStartNum(e.target.value)} min={1} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Count</label>
                  <input type="number" className="form-control" value={count} onChange={(e) => setCount(e.target.value)} min={1} max={50} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={bulkVehicleType} onChange={(e) => setBulkVehicleType(e.target.value)}>
                    <option value="CAR">CAR</option>
                    <option value="BIKE">BIKE</option>
                    <option value="ANY">ANY</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={submitting}>
                <PlusCircle size={16} /> Generate {count} Slots
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Current Slot Layout ({slots.length} Total Slots)
        </h3>
        <SlotGrid slots={slots} />
      </div>
    </div>
  );
};

export default ManageSlots;
