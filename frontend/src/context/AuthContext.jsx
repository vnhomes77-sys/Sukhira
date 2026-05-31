import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('suk_token') || null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const logout = useCallback(() => {
    localStorage.removeItem('suk_token');
    setToken(null);
    setUser(null);
    setAddresses([]);
    setWishlist([]);
  }, []);

  const loadAddresses = useCallback(async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  }, [token]);

  const loadWishlist = useCallback(async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  }, [token]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        loadAddresses(token);
        loadWishlist(token);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  }, [token, loadAddresses, loadWishlist, logout]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = useCallback(async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    localStorage.setItem('suk_token', data.token);
    setToken(data.token);
    setUser(data.user);
    loadAddresses(data.token);
    loadWishlist(data.token);
    return data.user;
  }, [loadAddresses, loadWishlist]);

  const sendOtp = useCallback(async (email) => {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  }, []);

  const register = useCallback(async () => {
    throw new Error('Registration is only permitted via Email OTP verification');
  }, []);

  const addAddress = useCallback(async (addressData) => {
    const res = await fetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to add address');
    }
    await loadAddresses();
  }, [token, loadAddresses]);

  const updateAddress = useCallback(async (id, addressData) => {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to update address');
    }
    await loadAddresses();
  }, [token, loadAddresses]);

  const deleteAddress = useCallback(async (id) => {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete address');
    }
    await loadAddresses();
  }, [token, loadAddresses]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!token) {
      throw new Error('Please login to wishlist products');
    }
    const res = await fetch(`${API_URL}/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: productId })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to toggle wishlist');
    }
    await loadWishlist();
  }, [token, loadWishlist]);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    addresses,
    wishlist,
    login,
    sendOtp,
    register,
    logout,
    addAddress,
    updateAddress,
    deleteAddress,
    toggleWishlist
  }), [user, token, loading, addresses, wishlist, login, sendOtp, register, logout, addAddress, updateAddress, deleteAddress, toggleWishlist]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
