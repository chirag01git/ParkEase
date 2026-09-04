import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMallApi } from '../../api/services';
import { Building2, AlertCircle, PlusCircle } from 'lucide-react';

const CreateMall = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [totalSlots, setTotalSlots] = useState(10);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await createMallApi({ name, address, city, totalSlots });
      if (res.data.success) {
        navigate('/owner/malls');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create mall');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="glass-card">
        <h2 className="page-title" style={{ fontSize: '1.4rem' }}>Register New Mall</h2>
        <p className="page-subtitle">New malls are created with status PENDING until approved by Administrator</p>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mall Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Orion City Centre Mall"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 124 Commercial Belt, Sector 5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Metropolis"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Planned Total Slots Capacity</label>
            <input
              type="number"
              className="form-control"
              value={totalSlots}
              onChange={(e) => setTotalSlots(e.target.value)}
              min={1}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
            <PlusCircle size={18} /> {loading ? 'Submitting Mall...' : 'Submit Mall for Admin Approval'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMall;
