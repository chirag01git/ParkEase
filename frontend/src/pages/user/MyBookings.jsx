import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookingsApi, cancelBookingApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import QrModal from '../../components/QrModal';
import { QrCode, XCircle, Eye, AlertCircle } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await getMyBookingsApi();
      if (res.data.success) {
        setBookings(res.data.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The slot will be released.')) return;
    setError('');
    setSuccess('');

    try {
      const res = await cancelBookingApi(bookingId);
      if (res.data.success) {
        setSuccess('Booking cancelled successfully. Slot released.');
        fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const openQr = (booking) => {
    setSelectedBooking(booking);
    setIsQrOpen(true);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">My Parking Reservations</h1>
        <p className="page-subtitle">View your active and past parking tickets</p>
      </div>

      {error && <div className="alert alert-danger"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h3>No Parking Reservations Found</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>You haven't made any parking reservations yet.</p>
          <Link to="/user/malls" className="btn btn-primary">
            Browse Malls & Book
          </Link>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Mall</th>
                  <th>Slot</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Bill Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <code style={{ color: '#38bdf8' }}>#{b._id.slice(-6)}</code>
                    </td>
                    <td><strong>{b.mall?.name || 'Mall'}</strong></td>
                    <td><strong style={{ color: '#34d399' }}>{b.slot?.slotNumber || 'Allocated'}</strong></td>
                    <td>{b.vehicleNumber} ({b.vehicleType})</td>
                    <td><StatusBadge status={b.bookingStatus} /></td>
                    <td>{b.entryTime ? new Date(b.entryTime).toLocaleTimeString() : '-'}</td>
                    <td>{b.exitTime ? new Date(b.exitTime).toLocaleTimeString() : '-'}</td>
                    <td>{b.amount ? `₹${b.amount}` : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openQr(b)}>
                          <QrCode size={14} /> QR
                        </button>

                        <Link to={`/user/bookings/${b._id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          <Eye size={14} />
                        </Link>

                        {b.bookingStatus === 'BOOKED' && (
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleCancel(b._id)}>
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QrModal booking={selectedBooking} isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </div>
  );
};

export default MyBookings;
