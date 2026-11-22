import React, { useEffect, useState } from 'react';
import { getGuardPaymentsApi, releasePaidVehicleApi, verifyEntryApi, verifyExitApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { QrCode, LogIn, LogOut, AlertCircle, CheckCircle2, ShieldCheck, DollarSign, Clock, CreditCard, RefreshCw, Unlock } from 'lucide-react';

const GuardDashboard = () => {
  const [qrToken, setQrToken] = useState('');
  const [mode, setMode] = useState('ENTRY'); // ENTRY or EXIT
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [releasingId, setReleasingId] = useState('');

  const loadPaymentStatuses = async () => {
    try {
      const res = await getGuardPaymentsApi();
      if (res.data.success) setPayments(res.data.data.payments);
    } catch (err) {
      console.error('Failed to load payment statuses', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const releaseVehicle = async (booking) => {
    if (!window.confirm(`Release ${booking.vehicleNumber}? Payment has been verified and the parking slot will become available.`)) return;
    setError('');
    setReleasingId(booking._id);
    try {
      const res = await releasePaidVehicleApi(booking._id);
      if (res.data.success) {
        setResult({ type: 'RELEASE', data: { booking: res.data.data.booking } });
        loadPaymentStatuses();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not release the vehicle.');
    } finally {
      setReleasingId('');
    }
  };

  useEffect(() => {
    loadPaymentStatuses();
    const refreshTimer = window.setInterval(loadPaymentStatuses, 15000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrToken.trim()) return;

    setError('');
    setResult(null);
    setLoading(true);

    try {
      if (mode === 'ENTRY') {
        const res = await verifyEntryApi({ qrCode: qrToken.trim() });
        if (res.data.success) {
          setResult({ type: 'ENTRY', data: res.data.data });
        }
      } else {
        const res = await verifyExitApi({ qrCode: qrToken.trim() });
        if (res.data.success) {
          setResult({ type: 'EXIT', data: res.data.data });
          loadPaymentStatuses();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={32} color="#3b82f6" /> Guard Gate Verification Portal
        </h1>
        <p className="page-subtitle">Scan or paste QR pass tokens to process server-verified entry & exit</p>
      </div>

      {/* Mode Selection Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          onClick={() => { setMode('ENTRY'); setError(''); setResult(null); }}
          style={{
            background: mode === 'ENTRY' ? '#1e293b' : '#0f172a',
            border: `2px solid ${mode === 'ENTRY' ? '#3b82f6' : '#334155'}`,
            padding: '1.25rem',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <LogIn size={28} color={mode === 'ENTRY' ? '#60a5fa' : '#94a3b8'} style={{ marginBottom: '0.35rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Verify Entry (Gate In)</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>State transition: BOOKED ➔ ACTIVE</p>
        </div>

        <div
          onClick={() => { setMode('EXIT'); setError(''); setResult(null); }}
          style={{
            background: mode === 'EXIT' ? '#1e293b' : '#0f172a',
            border: `2px solid ${mode === 'EXIT' ? '#10b981' : '#334155'}`,
            padding: '1.25rem',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <LogOut size={28} color={mode === 'EXIT' ? '#34d399' : '#94a3b8'} style={{ marginBottom: '0.35rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Verify Exit (Gate Out)</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>State transition: ACTIVE ➔ PAYMENT DUE; completes after payment</p>
        </div>
      </div>

      {/* Scanner / Token Form */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
              Scan / Enter QR Token Identifier
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. PE-a1b2c3d4-172543..."
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                required
                style={{ fontSize: '1.05rem', fontFamily: 'monospace' }}
              />
              <button
                type="submit"
                className={`btn ${mode === 'ENTRY' ? 'btn-primary' : 'btn-success'}`}
                style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                disabled={loading}
              >
                <QrCode size={18} /> {loading ? 'Verifying...' : `Process ${mode}`}
              </button>
            </div>
          </div>
        </form>

        {/* Error Feedback */}
        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            <AlertCircle size={20} />
            <div>
              <strong>Verification Failed:</strong> {error}
            </div>
          </div>
        )}

        {/* Verification Success Feedback */}
        {result && (
          <div
            style={{
              marginTop: '1.25rem',
              background: result.type === 'ENTRY' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${result.type === 'ENTRY' ? '#3b82f6' : '#10b981'}`,
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={24} color={result.type === 'ENTRY' ? '#60a5fa' : '#34d399'} />
              <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
                {result.type === 'ENTRY' ? 'Entry Verification Successful!' : result.type === 'RELEASE' ? 'Vehicle Released Successfully!' : 'Exit Recorded — Payment Pending'}
              </h3>
            </div>

            {result.type === 'ENTRY' ? (
              <div>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                  Vehicle <strong>{result.data.booking.vehicleNumber}</strong> has been granted gate entry.
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                  <div>Slot Assigned: <strong style={{ color: '#34d399' }}>{result.data.slotNumber}</strong></div>
                  <div>Entry Time: <strong>{new Date(result.data.entryTime).toLocaleTimeString()}</strong></div>
                  <div>Status: <StatusBadge status={result.data.booking.bookingStatus} /></div>
                </div>
              </div>
            ) : result.type === 'RELEASE' ? (
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>Payment for <strong>{result.data.booking.vehicleNumber}</strong> is verified. The vehicle is released and its parking slot is now AVAILABLE.</p>
            ) : (
              <div>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                  Vehicle <strong>{result.data.summary.vehicleNumber}</strong> exit processed. The parking bill is awaiting user payment; the booking is not completed yet.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TOTAL DURATION</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={18} /> {result.data.summary.durationInHours} hr(s)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>BILL AMOUNT</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <DollarSign size={18} /> ₹{result.data.summary.totalAmount}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SLOT RELEASED</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
                      AVAILABLE
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PAYMENT STATUS</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.25rem' }}>PAYMENT DUE</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={20} color="#60a5fa" /> Recent Payment Status</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Updates automatically every 15 seconds after the user completes Razorpay checkout.</p>
          </div>
          <button className="btn btn-outline" onClick={() => { setPaymentsLoading(true); loadPaymentStatuses(); }} style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem' }} disabled={paymentsLoading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {paymentsLoading ? (
          <div style={{ color: '#94a3b8', padding: '1rem 0' }}>Loading payment statuses…</div>
        ) : payments.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '1rem 0' }}>No completed parking bills yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead><tr><th>Vehicle</th><th>Mall / Slot</th><th>Bill</th><th>Payment</th><th>Reference</th><th>Action</th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td><strong>{payment.vehicleNumber}</strong><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{payment.user?.name || 'User'}</div></td>
                    <td>{payment.mall?.name || 'Mall'}<div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{payment.slot?.slotNumber || 'Slot'}</div></td>
                    <td>₹{payment.amount}</td>
                    <td><StatusBadge status={payment.paymentStatus || 'PENDING'} /></td>
                    <td><code style={{ color: payment.paymentReference ? '#38bdf8' : '#94a3b8', fontSize: '0.75rem' }}>{payment.paymentReference || 'Awaiting payment'}</code></td>
                    <td>{payment.bookingStatus === 'PAYMENT_PAID' ? <button className="btn btn-success" style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }} onClick={() => releaseVehicle(payment)} disabled={releasingId === payment._id}><Unlock size={14} /> {releasingId === payment._id ? 'Releasing…' : 'Release'}</button> : payment.bookingStatus === 'PAYMENT_PENDING' ? <span style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>Awaiting user payment</span> : <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 700 }}>Released</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardDashboard;
