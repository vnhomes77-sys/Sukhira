import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          const isAdminRole = ['owner', 'manager', 'order_staff', 'support'].includes(userData.role);
          if (isAdminRole && userData.status === 'active') {
            setUser(userData);
          } else {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        if (error.message && error.message.includes('token')) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, handleLogout]);

  const handleLogin = useCallback(async (email, otp) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp, isAdminLogin: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const isAdminRole = ['owner', 'manager', 'order_staff', 'support'].includes(data.user.role);
      if (!isAdminRole) {
        throw new Error('Access denied: You do not have administrator permissions');
      }

      if (data.user.status !== 'active') {
        throw new Error('Access denied: Your account is deactivated');
      }

      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const handleSendOtp = useCallback(async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, isAdminLogin: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      return data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    sendOtp: handleSendOtp,
    logout: handleLogout,
    hasRole
  }), [user, token, loading, handleLogin, handleSendOtp, handleLogout, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
