import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from 'lucide-react';
import { createRazorpayOrderApi, getBookingByIdApi, verifyRazorpayPaymentApi } from '../../api/services';

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = resolve;
  script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded. Check your internet connection and try again.'));
  document.body.appendChild(script);
});

const PaymentCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const response = await getBookingByIdApi(id);
        if (response.data.success) setBooking(response.data.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the parking bill.');
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [id]);

  const startPayment = async () => {
    setError('');
    setPaying(true);
    try {
      await loadRazorpayCheckout();
      const orderResponse = await createRazorpayOrderApi(id);
      const { order, keyId, customer, booking: orderBooking } = orderResponse.data.data;
      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkEase',
        description: `Parking bill for ${orderBooking.mall}`,
        order_id: order.id,
        prefill: { name: customer.name || '', email: customer.email || '', contact: customer.contact || '' },
        theme: { color: '#3b82f6' },
        handler: async (paymentResult) => {
          try {
            const verifyResponse = await verifyRazorpayPaymentApi(id, paymentResult);
            setBooking(verifyResponse.data.data.booking);
            setReceipt(verifyResponse.data.data.receipt);
          } catch (verifyError) {
            setError(verifyError.response?.data?.message || 'Payment was received but could not be verified. Please contact support with your Razorpay payment ID.');
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      razorpay.open();
    } catch (checkoutError) {
      setError(checkoutError.response?.data?.message || checkoutError.message || 'Could not start Razorpay checkout.');
      setPaying(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading secure checkout…</div>;
  if (!booking) return <div className="alert alert-danger">{error || 'Parking bill not found.'}</div>;

  if (receipt || booking.paymentStatus === 'PAID') {
    const activeReceipt = receipt || { reference: booking.paymentReference, amount: booking.amount, paidAt: booking.paidAt };
    return (
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={52} color="#34d399" style={{ marginBottom: '0.85rem' }} />
          <h1 className="page-title">Payment verified</h1>
          <p className="page-subtitle">Your Razorpay payment has been verified. Please wait for the guard to release the vehicle.</p>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem', textAlign: 'left', marginBottom: '1.25rem' }}>
            <p><strong>Amount:</strong> ₹{activeReceipt.amount}</p>
            <p><strong>Gateway:</strong> Razorpay</p>
            <p><strong>Payment ID:</strong> {activeReceipt.reference}</p>
            <p><strong>Paid at:</strong> {activeReceipt.paidAt ? new Date(activeReceipt.paidAt).toLocaleString() : 'Just now'}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/user/bookings')}>Back to My Bookings</button>
        </div>
      </div>
    );
  }

  const paymentAvailable = booking.bookingStatus === 'PAYMENT_PENDING' && booking.amount > 0;
  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <Link to={`/user/bookings/${id}`} className="btn btn-outline" style={{ marginBottom: '1.25rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}><ArrowLeft size={16} /> Back to ticket</Link>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '0.8rem', borderRadius: '14px', color: '#fff', marginBottom: '0.85rem' }}><CreditCard size={30} /></div>
          <h1 className="page-title" style={{ fontSize: '1.55rem' }}>Secure payment</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Continue to Razorpay to select UPI, card, net banking, or another available method.</p>
        </div>
        {error && <div className="alert alert-danger"><AlertCircle size={17} /> {error}</div>}
        {!paymentAvailable ? (
          <div className="alert alert-info"><AlertCircle size={17} /> Your bill will be available after a guard verifies your exit time.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '10px', background: '#0f172a', marginBottom: '1.25rem', border: '1px solid #334155' }}>
              <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Parking at {booking.mall?.name}</div><div style={{ fontWeight: 600 }}>{booking.duration} hour{booking.duration === 1 ? '' : 's'} parked</div></div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#34d399' }}>₹{booking.amount}</div>
            </div>
            <div className="alert alert-info" style={{ fontSize: '0.82rem' }}><ShieldCheck size={17} /> In Test Mode, Razorpay simulates payment and does not move real money.</div>
            <button className="btn btn-primary" type="button" onClick={startPayment} style={{ width: '100%', padding: '0.8rem' }} disabled={paying}>
              {paying ? <><LoaderCircle size={18} /> Opening Razorpay…</> : <><CreditCard size={18} /> Pay ₹{booking.amount} with Razorpay</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCheckout;
