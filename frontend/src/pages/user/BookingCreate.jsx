import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMallByIdApi, createBookingApi, getAvailableSlotsApi } from '../../api/services';
import QrModal from '../../components/QrModal';
import { Car, Bike, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';

const BookingCreate = () => {
  const { mallId } = useParams();
  const navigate = useNavigate();

  const [mall, setMall] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [availableCount, setAvailableCount] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    fetchMall();
  }, [mallId, vehicleType]);

  const fetchMall = async () => {
    try {
      const [mallRes, slotRes] = await Promise.all([
        getMallByIdApi(mallId),
        getAvailableSlotsApi(mallId, vehicleType),
      ]);
      if (mallRes.data.success) setMall(mallRes.data.data.mall);
      if (slotRes.data.success) setAvailableCount(slotRes.data.data.count);
    } catch (err) {
      console.error('Error fetching mall for booking', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await createBookingApi({
        mallId,
        vehicleNumber,
        vehicleType,
      });

      if (res.data.success) {
        setBookingResult(res.data.data.booking);
        setIsQrOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsQrOpen(false);
    navigate('/user/bookings');
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="glass-card">
        <h2 className="page-title" style={{ fontSize: '1.4rem' }}>Reserve Parking Slot</h2>
        <p className="page-subtitle">Atomic allocation will assign the first available slot automatically</p>

        {mall && (
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #334155' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{mall.name}</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{mall.address}, {mall.city}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
              Available Slots ({vehicleType}): {availableCount}
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vehicle Registration Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. KA-05-MH-9999"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setVehicleType('CAR')}
                style={{
                  border: `2px solid ${vehicleType === 'CAR' ? '#3b82f6' : '#334155'}`,
                  background: vehicleType === 'CAR' ? 'rgba(59, 130, 246, 0.1)' : '#0f172a',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Car size={24} color={vehicleType === 'CAR' ? '#60a5fa' : '#94a3b8'} />
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>CAR</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>₹50 1st hr / ₹30 hr after</div>
              </div>

              <div
                onClick={() => setVehicleType('BIKE')}
                style={{
                  border: `2px solid ${vehicleType === 'BIKE' ? '#3b82f6' : '#334155'}`,
                  background: vehicleType === 'BIKE' ? 'rgba(59, 130, 246, 0.1)' : '#0f172a',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Bike size={24} color={vehicleType === 'BIKE' ? '#60a5fa' : '#94a3b8'} />
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>BIKE</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>₹30 1st hr / ₹20 hr after</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading || availableCount === 0}
          >
            <Ticket size={18} /> {loading ? 'Allocating Slot Atomically...' : 'Confirm & Generate Ticket'}
          </button>
        </form>
      </div>

      <QrModal booking={bookingResult} isOpen={isQrOpen} onClose={handleModalClose} />
    </div>
  );
};

export default BookingCreate;
