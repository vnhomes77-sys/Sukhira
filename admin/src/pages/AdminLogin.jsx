import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, KeyRound, Mail, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, sendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the originally requested route, or default to home dashboard
  const from = location.state?.from?.pathname || '/';

  const handleOtpChange = (value, index) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      setOtpCode(newOtp.join(''));
      return;
    }

    const valueArray = cleanValue.split('');
    const newOtp = [...otpValues];
    
    for (let i = 0; i < valueArray.length && index + i < 6; i++) {
      newOtp[index + i] = valueArray[i];
    }
    
    setOtpValues(newOtp);
    setOtpCode(newOtp.join(''));

    // Move focus to next input
    const nextIndex = Math.min(index + valueArray.length, 5);
    const nextInput = document.getElementById(`otp-slot-${nextIndex}`);
    if (nextInput) nextInput.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
        setOtpCode(newOtp.join(''));
        const prevInput = document.getElementById(`otp-slot-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
        }
      } else if (otpValues[index]) {
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
        setOtpCode(newOtp.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-slot-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-slot-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtpValues(newOtp);
      setOtpCode(pastedData);
      const lastInput = document.getElementById(`otp-slot-5`);
      if (lastInput) lastInput.focus();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      setSuccess('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP code. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await login(email, otpCode);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background Glowing Decors */}
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      <div className="login-card">
        <div className="login-header">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            padding: '1rem',
            borderRadius: '16px',
            color: '#ea580c',
            marginBottom: '1rem'
          }}>
            <Sparkles size={36} />
          </div>
          <h2>SUKHIRA ADMIN</h2>
          <p>Sign in to manage skincare catalog, inventory and orders</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '0.8rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            border: '1px solid rgba(22, 163, 74, 0.2)',
            color: '#16a34a',
            padding: '0.8rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem'
          }}>
            <span>{success}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: '1.8rem' }}>
              <label htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="owner@sukhira.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '2.8rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <p style={{ fontSize: '0.9rem', color: '#8f4f2a' }}>
                Verification code sent to:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                <strong style={{ fontSize: '1.05rem', color: '#5c2509' }}>{email}</strong>
                <button 
                  type="button" 
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setOtpValues(['', '', '', '', '', '']);
                    setSuccess('');
                    setError('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: '0.2rem' }}
                  title="Change email"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#8f4f2a' }}>
                <KeyRound size={14} /> Secure OTP Verification
              </label>
              
              <div className="otp-input-container" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <React.Fragment key={idx}>
                    <input
                      id={`otp-slot-${idx}`}
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="otp-slot-input"
                      required
                      disabled={loading}
                      autoFocus={idx === 0}
                    />
                    {idx === 2 && <span className="otp-separator">-</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                type="submit"
                className="btn-primary login-btn"
                disabled={loading || otpCode.length !== 6}
                style={{ marginTop: 0 }}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
