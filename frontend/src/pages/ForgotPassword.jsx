import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { forgotPasswordApi, resetPasswordApi } from '../api/services';

const passwordHelp = 'Use 8+ characters with uppercase, lowercase, number, and special character.';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getError = (err, fallback) => err.response?.data?.message || fallback;

  const sendCode = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await forgotPasswordApi({ email });
      setCodeSent(true);
      setMessage(response.data?.message || 'If an account exists for this email, a reset code has been sent.');
    } catch (err) {
      setError(getError(err, 'Could not send a reset code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordApi({ email, otp, password });
      setMessage(response.data?.message || 'Password reset successfully. You can now sign in.');
      setOtp('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getError(err, 'Could not reset your password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '0.85rem', borderRadius: '16px', color: '#fff', marginBottom: '0.9rem' }}>
            <KeyRound size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.3rem' }}>Reset your password</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            {codeSent ? 'Enter the code sent to your email and choose a new password.' : 'We’ll email you a six-digit reset code.'}
          </p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}
        {message && <div className="alert alert-success" style={{ marginBottom: '1rem' }}><CheckCircle2 size={16} /> {message}</div>}

        {!codeSent ? (
          <form onSubmit={sendCode}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="Enter your account email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Sending code…' : <><Send size={16} /> Send reset code</>}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            <div className="form-group">
              <label className="form-label">Reset Code</label>
              <input className="form-control" inputMode="numeric" maxLength="6" placeholder="Six-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required autoComplete="one-time-code" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" placeholder="Choose a new password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.4rem' }}>{passwordHelp}</small>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" placeholder="Repeat your new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Resetting password…' : 'Reset password'}
            </button>
            <button type="button" onClick={() => { setCodeSent(false); setError(''); setMessage(''); }} style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}>
              Use a different email
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><ArrowLeft size={15} /> Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
