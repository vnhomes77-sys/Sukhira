import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { KeyRound, Mail, User, Phone, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, user, token } = useAuth();
  const { syncGuestCart } = useCart();

  const redirectPath = searchParams.get('redirect') || 'account';

  // Toggle mode
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isOtpMode, setIsOtpMode] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // OTP simulated state
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // Status State
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(`/${redirectPath === 'account' ? 'account' : redirectPath}`);
    }
  }, [user, navigate, redirectPath]);

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (isLoginMode) {
        const loggedUser = await login(email, password);
        const savedToken = localStorage.getItem('suk_token');
        await syncGuestCart(savedToken);
      } else {
        const newUser = await register(name, email, password, phone);
        const savedToken = localStorage.getItem('suk_token');
        await syncGuestCart(savedToken);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg('Please enter your phone number to receive an OTP.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setSimulatedOtp(code);
      setOtpSent(true);
      setLoading(false);
      alert(`[SMS SIMULATION] Your OTP to login to Sukhira is: ${code}`);
    }, 1000);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpCode !== simulatedOtp) {
      setErrorMsg('Invalid OTP. Please check the simulated SMS alert.');
      return;
    }
    
    setLoading(true);
    try {
      // Mock login via OTP using test account
      // We will register/login with a mock email "otp_user@sukhira.com"
      const mockEmail = `otp_${phone}@sukhira.com`;
      let userObj;
      try {
        userObj = await login(mockEmail, 'otp_password_123');
      } catch (err) {
        // Register if not exist
        userObj = await register('OTP User', mockEmail, 'otp_password_123', phone);
      }
      const savedToken = localStorage.getItem('suk_token');
      await syncGuestCart(savedToken);
    } catch (err) {
      setErrorMsg(err.message || 'OTP authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginMock = async () => {
    setErrorMsg('');
    setLoading(true);
    setTimeout(async () => {
      try {
        // Login with a google mock profile
        const googleEmail = 'google_customer@gmail.com';
        let userObj;
        try {
          userObj = await login(googleEmail, 'google_pass_secure');
        } catch (err) {
          userObj = await register('Google Customer', googleEmail, 'google_pass_secure', '');
        }
        const savedToken = localStorage.getItem('suk_token');
        await syncGuestCart(savedToken);
      } catch (err) {
        setErrorMsg('Google Sign-in simulation failed.');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="checkout-page" style={{ maxWidth: '440px', margin: '0 auto' }}>
      <div className="account-dashboard-card" style={{ padding: '2.5rem 2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {isOtpMode ? 'OTP Login' : isLoginMode ? 'Sign In' : 'Create Account'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
          {isOtpMode ? 'Fast verification using your phone' : isLoginMode ? 'Access your saved addresses & order history' : 'Register to unlock seasonal collections'}
        </p>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Regular Passwords forms */}
        {!isOtpMode && (
          <form onSubmit={handlePasswordAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLoginMode && (
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <User size={14} /> Full Name
                </label>
                <input type="text" placeholder="e.g. Priyesh Patel" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <Mail size={14} /> Email Address
              </label>
              <input type="email" placeholder="e.g. customer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {!isLoginMode && (
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <Phone size={14} /> Phone Number (Optional)
                </label>
                <input type="text" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <KeyRound size={14} /> Password
              </label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : isLoginMode ? 'Sign In' : 'Sign Up'}</span>
            </button>
          </form>
        )}

        {/* OTP Authentication Form */}
        {isOtpMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <Phone size={14} /> Enter Mobile Number
                  </label>
                  <input type="text" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                  <span>{loading ? 'Sending...' : 'Send Verification OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <KeyRound size={14} /> Enter 4-Digit OTP
                  </label>
                  <input type="text" placeholder="e.g. 1234" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                  <span>{loading ? 'Verifying...' : 'Verify & Login'}</span>
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className="btn-secondary" style={{ width: '100%' }}>
                  Back to edit number
                </button>
              </form>
            )}
          </div>
        )}

        {/* Alternate login methods */}
        <div style={{ margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Or Connect With</span>
          <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button onClick={handleGoogleLoginMock} disabled={loading} className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.7rem' }}>
            {/* Google mini icon */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.2-.15-1.7H9v3.3h4.8c-.2 1-.8 1.9-1.6 2.5v2.1h2.6c1.5-1.4 2.4-3.5 2.4-6.2z"/>
              <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.6-2.1c-.7.5-1.7.8-3.4.8-2.6 0-4.8-1.8-5.6-4.2H.7v2.2C2.2 15.5 5.4 18 9 18z"/>
              <path fill="#FBBC05" d="M3.4 10.3c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V4.1H.7C.2 5.2 0 6.6 0 8s.2 2.8.7 3.9l2.7-1.6z"/>
              <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.4.9 11.4 0 9 0 5.4 0 2.2 2.5.7 5.6l2.7 2.1c.8-2.4 3-4.1 5.6-4.1z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => {
              setIsOtpMode(!isOtpMode);
              setOtpSent(false);
              setErrorMsg('');
            }}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.7rem' }}
          >
            <span>{isOtpMode ? 'Sign In with Email & Password' : 'Sign In using OTP'}</span>
          </button>
        </div>

        {/* Toggle Mode */}
        {!isOtpMode && (
          <div style={{ marginTop: '1.8rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg('');
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontWeight: 700, cursor: 'pointer' }}
            >
              {isLoginMode ? 'Register Now' : 'Login Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
