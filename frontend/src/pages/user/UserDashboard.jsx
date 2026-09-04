import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookingsApi, getMallsApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import QrModal from '../../components/QrModal';
import { Building2, Ticket, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [approvedMallsCount, setApprovedMallsCount] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, mallsRes] = await Promise.all([getMyBookingsApi(), getMallsApi()]);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.data.bookings);
      if (mallsRes.data.success) setApprovedMallsCount(mallsRes.data.data.malls.length);
    } catch (err) {
      console.error('Failed to load user dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBooking = bookings.find(
    (b) => b.bookingStatus === 'BOOKED' || b.bookingStatus === 'ACTIVE'
  );

  const openQr = (booking) => {
    setSelectedBooking(booking);
    setIsQrOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">User Parking Dashboard</h1>
          <p className="page-subtitle">Manage your parking reservations and digital QR passes</p>
        </div>
        <Link to="/user/malls" className="btn btn-primary">
          <Building2 size={18} /> Book New Parking Slot
        </Link>
      </div>

      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Building2 />
          </div>
          <div>
            <div className="stat-value">{approvedMallsCount}</div>
            <div className="stat-label">Approved Malls</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Ticket />
          </div>
          <div>
            <div className="stat-value">{bookings.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <QrCode />
          </div>
          <div>
            <div className="stat-value">{activeBooking ? 1 : 0}</div>
            <div className="stat-label">Active Pass</div>
          </div>
        </div>
      </div>

      {/* Active Booking Banner */}
      {activeBooking ? (
        <div
          className="glass-card"
          style={{
            borderColor: '#3b82f6',
            background: 'linear-gradient(135deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)',
            marginBottom: '2rem',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <StatusBadge status={activeBooking.bookingStatus} />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Booking ID: #{activeBooking._id.slice(-6)}
                </span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                {activeBooking.mall?.name}
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Slot: <strong style={{ color: '#38bdf8' }}>{activeBooking.slot?.slotNumber || 'Allocated'}</strong> | Vehicle: <strong>{activeBooking.vehicleNumber}</strong> ({activeBooking.vehicleType})
              </p>
              {activeBooking.entryTime && (
                <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.35rem' }}>
                  Entered Gate: {new Date(activeBooking.entryTime).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => openQr(activeBooking)}>
                <QrCode size={18} /> Show Gate QR Ticket
              </button>
              <Link to={`/user/bookings/${activeBooking._id}`} className="btn btn-outline">
                View Ticket Details
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
          <ShieldCheck size={36} color="#34d399" style={{ marginBottom: '0.5rem' }} />
          <h3>No Active Parking Reservation</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
            You have no active bookings right now. Reserve a spot before heading to the mall!
          </p>
          <Link to="/user/malls" className="btn btn-primary">
            Find & Reserve Parking <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Recent History Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Booking History</h3>
        {bookings.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No booking history found.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Mall</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b._id}>
                    <td>#{b._id.slice(-6)}</td>
                    <td>{b.mall?.name || 'Mall'}</td>
                    <td>{b.vehicleNumber} ({b.vehicleType})</td>
                    <td><StatusBadge status={b.bookingStatus} /></td>
                    <td>{b.duration ? `${b.duration} hr(s)` : '-'}</td>
                    <td>{b.amount ? `₹${b.amount}` : '-'}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openQr(b)}>
                        <QrCode size={14} /> QR Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QrModal booking={selectedBooking} isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </div>
  );
};

export default UserDashboard;
