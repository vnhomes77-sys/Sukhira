import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Mail, KeyRound, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, sendOtp, user } = useAuth();
  const { syncGuestCart } = useCart();

  const redirectPath = searchParams.get('redirect') || 'account';

  // Form Fields
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

  // Status State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user && !isSyncing) {
      navigate(`/${redirectPath === 'account' ? 'account' : redirectPath}`);
    }
  }, [user, isSyncing, navigate, redirectPath]);

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
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setIsSyncing(true);
    try {
      await login(email, otpCode);
      const savedToken = localStorage.getItem('suk_token');
      await syncGuestCart(savedToken);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page" style={{ maxWidth: '540px', margin: '0 auto' }}>
      <div className="account-dashboard-card" style={{ padding: '2.5rem 2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          Sukhira Sign In
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
          {otpSent ? 'Enter the OTP code sent to your email to verify' : 'Authenticate securely using a one-time passcode'}
        </p>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#16a34a', padding: '0.8rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
            <span>{successMsg}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <Mail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                placeholder="e.g. customer@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}>
              <span>{loading ? 'Sending...' : 'Send Verification OTP'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Verification code sent to:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{email}</strong>
                <button 
                  type="button" 
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setOtpValues(['', '', '', '', '', '']);
                    setSuccessMsg('');
                    setErrorMsg('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: '0.2rem' }}
                  title="Change email"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
              <button type="submit" disabled={loading || otpCode.length !== 6} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}>
                <LogIn size={18} />
                <span>{loading ? 'Verifying...' : 'Verify & Login'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
