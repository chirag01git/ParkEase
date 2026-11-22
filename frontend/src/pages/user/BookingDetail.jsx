import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookingByIdApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Clock, DollarSign, CheckCircle2, QrCode, CreditCard } from 'lucide-react';

const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await getBookingByIdApi(id);
      if (res.data.success) {
        setBooking(res.data.data.booking);
      }
    } catch (err) {
      console.error('Failed to load booking details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading ticket details...</div>;
  if (!booking) return <div className="alert alert-danger">Booking not found.</div>;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <Link to="/user/bookings" className="btn btn-outline" style={{ marginBottom: '1.25rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Back to My Bookings
      </Link>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ticket #{booking._id}</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{booking.mall?.name}</h2>
          </div>
          <StatusBadge status={booking.bookingStatus} />
        </div>

        {/* State Machine Flow Indicator */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', background: '#0f172a', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #334155' }}>
          <div style={{ textAlign: 'center', opacity: booking.bookingStatus === 'BOOKED' ? 1 : 0.6 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STEP 1</div>
            <div style={{ fontWeight: 700, color: '#fbbf24' }}>BOOKED</div>
          </div>

          <div style={{ textAlign: 'center', opacity: booking.bookingStatus === 'ACTIVE' ? 1 : 0.6 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STEP 2</div>
            <div style={{ fontWeight: 700, color: '#60a5fa' }}>ACTIVE (Parked)</div>
          </div>

          <div style={{ textAlign: 'center', opacity: booking.bookingStatus === 'PAYMENT_PENDING' ? 1 : 0.6 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STEP 3</div>
            <div style={{ fontWeight: 700, color: '#fbbf24' }}>PAYMENT DUE</div>
          </div>

          <div style={{ textAlign: 'center', opacity: booking.bookingStatus === 'PAYMENT_PAID' ? 1 : 0.6 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STEP 4</div>
            <div style={{ fontWeight: 700, color: '#34d399' }}>PAID</div>
          </div>

          <div style={{ textAlign: 'center', opacity: booking.bookingStatus === 'COMPLETED' ? 1 : 0.6 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STEP 5</div>
            <div style={{ fontWeight: 700, color: '#34d399' }}>COMPLETED</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Allocated Parking Slot</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                Slot: {booking.slot?.slotNumber || 'Allocated'}
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Vehicle Number & Category</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                {booking.vehicleNumber} ({booking.vehicleType})
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Entry Timestamp</div>
              <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
                {booking.entryTime ? new Date(booking.entryTime).toLocaleString() : 'Not entered yet'}
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Exit Timestamp</div>
              <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
                {booking.exitTime ? new Date(booking.exitTime).toLocaleString() : 'Not exited yet'}
              </div>
            </div>

            {['PAYMENT_PENDING', 'PAYMENT_PAID', 'COMPLETED'].includes(booking.bookingStatus) && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '8px', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>PARKING BILL SUMMARY</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  Duration: {booking.duration} hr(s) | Total Amount: ₹{booking.amount}
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', background: '#fff', padding: '1rem', borderRadius: '12px' }}>
            <QRCodeSVG value={booking.qrCode} size={160} level="H" />
            <div style={{ fontSize: '0.7rem', color: '#0f172a', marginTop: '0.5rem', fontWeight: 600, wordBreak: 'break-all' }}>
              {booking.qrCode}
            </div>
          </div>
        </div>

        {['PAYMENT_PENDING', 'PAYMENT_PAID', 'COMPLETED'].includes(booking.bookingStatus) && booking.amount > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '10px', border: `1px solid ${booking.paymentStatus === 'PAID' ? 'rgba(16,185,129,.45)' : 'rgba(59,130,246,.45)'}`, background: booking.paymentStatus === 'PAID' ? 'rgba(16,185,129,.08)' : 'rgba(59,130,246,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: booking.paymentStatus === 'PAID' ? '#34d399' : '#fff' }}>
                {booking.paymentStatus === 'PAID' ? (booking.bookingStatus === 'PAYMENT_PAID' ? 'Payment complete — awaiting guard release' : 'Payment complete') : `Parking bill: ₹${booking.amount}`}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                {booking.paymentStatus === 'PAID' ? `Paid via ${booking.paymentMethod} · The guard will release the vehicle next.` : 'Continue to Razorpay to choose a payment method.'}
              </div>
            </div>
            {booking.paymentStatus !== 'PAID' && <Link to={`/user/bookings/${booking._id}/pay`} className="btn btn-primary"><CreditCard size={16} /> Pay Now</Link>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
