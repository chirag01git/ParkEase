import React, { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { sendOtpApi } from '../api/services';
import {
  UserPlus, AlertCircle, CheckCircle, XCircle,
  Eye, EyeOff, Mail, ShieldCheck, RefreshCw, Loader
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const getStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '#475569' };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[a-z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const map = [
    null,
    { label: 'Very Weak',  color: '#ef4444' },
    { label: 'Weak',       color: '#f97316' },
    { label: 'Fair',       color: '#eab308' },
    { label: 'Strong',     color: '#22c55e' },
    { label: 'Very Strong',color: '#10b981' },
  ];
  return { score: s, ...map[s] };
};

const Rule = ({ met, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: met ? '#22c55e' : '#64748b', transition: 'color 0.25s' }}>
    {met ? <CheckCircle size={12} /> : <XCircle size={12} />} {text}
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────
const Register = () => {
  const [step, setStep]       = useState(1); // 1 = fill form, 2 = enter OTP
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched]  = useState({});
  const [error, setError]      = useState('');
  const [success, setSuccess]  = useState('');
  const [loading, setLoading]  = useState(false);
  const [countdown, setCountdown] = useState(0); // resend cooldown

  const otpRefs = useRef([]);
  const { register } = useContext(AuthContext);
  const navigate     = useNavigate();

  const strength = getStrength(formData.password);
  const emailOk  = emailRegex.test(formData.email);
  const rules    = [
    { met: formData.password.length >= 8,            text: '8+ characters' },
    { met: /[A-Z]/.test(formData.password),           text: 'Uppercase (A–Z)' },
    { met: /[a-z]/.test(formData.password),           text: 'Lowercase (a–z)' },
    { met: /[0-9]/.test(formData.password),           text: 'Number (0–9)' },
    { met: /[^A-Za-z0-9]/.test(formData.password),   text: 'Special char (!@#$…)' },
  ];
  const allRulesMet = rules.every(r => r.met);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleBlur   = (e) => setTouched({ ...touched, [e.target.name]: true });

  // ── OTP input handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return; // digits only
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Start cooldown timer ────────────────────────────────────────────────────
  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.name.trim())     return setError('Full name is required.');
    if (!emailOk)                  return setError('Please enter a valid email address.');
    if (!formData.phone.trim())    return setError('Phone number is required.');
    if (!allRulesMet)              return setError('Please create a stronger password.');

    setLoading(true);
    try {
      await sendOtpApi({ email: formData.email, name: formData.name });
      setSuccess(`OTP sent to ${formData.email}! Check your inbox (and spam folder).`);
      setStep(2);
      setOtp(['', '', '', '', '', '']);
      startCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await sendOtpApi({ email: formData.email, name: formData.name });
      setSuccess('New OTP sent! Check your inbox.');
      setOtp(['', '', '', '', '', '']);
      startCountdown(60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP + Register ───────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) return setError('Please enter the complete 6-digit OTP.');

    setLoading(true);
    try {
      const user = await register({ ...formData, otp: enteredOtp });
      if (user.role === 'MALL_OWNER')      navigate('/owner/dashboard');
      else if (user.role === 'GUARD')      navigate('/guard/dashboard');
      else                                 navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {step === 1 ? 'Create ParkEase Account' : '📧 Verify Your Email'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {step === 1
              ? 'Register as User, Mall Owner, or Guard'
              : `Enter the 6-digit OTP sent to ${formData.email}`}
          </p>
        </div>

        {/* ── Step indicators ── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0' }}>
          {['Fill Details', 'Verify Email'].map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step > i ? '#3b82f6' : step === i + 1 ? '#3b82f6' : '#1e293b',
                  border: '2px solid',
                  borderColor: step >= i + 1 ? '#3b82f6' : '#334155',
                  color: step >= i + 1 ? '#fff' : '#64748b',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s'
                }}>
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <div style={{ fontSize: '0.7rem', color: step >= i + 1 ? '#93c5fd' : '#475569' }}>{label}</div>
              </div>
              {i === 0 && <div style={{ height: 2, flex: 0.5, background: step > 1 ? '#3b82f6' : '#1e293b', transition: 'background 0.4s', marginBottom: '20px' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="alert" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#86efac', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* ══════════════════ STEP 1: Registration Form ══════════════════ */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-control" placeholder="John Doe"
                value={formData.name} onChange={handleChange} onBlur={handleBlur} required />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" name="email" className="form-control"
                placeholder="john@example.com"
                value={formData.email} onChange={handleChange} onBlur={handleBlur} required
                style={{ borderColor: touched.email && formData.email && !emailOk ? '#ef4444' : '' }}
              />
              {touched.email && formData.email && (
                <p style={{ fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: emailOk ? '#22c55e' : '#ef4444' }}>
                  {emailOk ? <><CheckCircle size={12} /> Valid format — OTP will be sent to verify</>
                           : <><XCircle size={12} /> Enter a valid email (e.g. user@example.com)</>}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" name="phone" className="form-control" placeholder="9876543210"
                value={formData.phone} onChange={handleChange} required />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} name="password" className="form-control"
                  placeholder="Create a strong password"
                  value={formData.password} onChange={handleChange} onBlur={handleBlur}
                  style={{ paddingRight: '2.8rem' }} required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {formData.password && (
                <>
                  <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.score ? strength.color : '#1e293b', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.5rem', padding: '0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    {rules.map((r, i) => <Rule key={i} met={r.met} text={r.text} />)}
                  </div>
                </>
              )}
            </div>


            {/* Info note — no role selection needed */}
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '0.5rem', fontSize: '0.78rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🚗 Registering as a <strong>Vehicle Owner / Driver</strong> account
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}>
              {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP…</>
                       : <><Mail size={16} /> Send Verification OTP</>}
            </button>
          </form>
        )}

        {/* ══════════════════ STEP 2: OTP Verification ══════════════════ */}
        {step === 2 && (
          <form onSubmit={handleRegister} noValidate>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={48} style={{ color: '#3b82f6', marginBottom: '0.75rem' }} />
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: '#e2e8f0' }}>{formData.email}</strong>
              </p>
            </div>

            {/* OTP boxes */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }} onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpRefs.current[idx] = el}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  style={{
                    width: 52, height: 60, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                    borderRadius: 10, border: `2px solid ${digit ? '#3b82f6' : '#334155'}`,
                    background: digit ? 'rgba(59,130,246,0.1)' : '#0f172a',
                    color: '#e2e8f0', outline: 'none', transition: 'all 0.2s',
                    caretColor: '#3b82f6'
                  }}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading || otp.join('').length < 6}>
              {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
                       : <><ShieldCheck size={16} /> Verify & Create Account</>}
            </button>

            {/* Resend + Edit email */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
              <button type="button" onClick={handleResend} disabled={countdown > 0 || loading}
                style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer', color: countdown > 0 ? '#475569' : '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                <RefreshCw size={13} />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: '0.8rem' }}>
                ← Change email
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
