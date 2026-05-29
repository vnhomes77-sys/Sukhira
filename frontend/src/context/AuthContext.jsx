import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('suk_token') || null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
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
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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
  };

  const register = async (name, email, password, phone) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    localStorage.setItem('suk_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAddresses([]);
    setWishlist([]);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('suk_token');
    setToken(null);
    setUser(null);
    setAddresses([]);
    setWishlist([]);
  };

  const loadAddresses = async (authToken = token) => {
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
  };

  const addAddress = async (addressData) => {
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
  };

  const updateAddress = async (id, addressData) => {
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
  };

  const deleteAddress = async (id) => {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete address');
    }
    await loadAddresses();
  };

  const loadWishlist = async (authToken = token) => {
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
  };

  const toggleWishlist = async (productId) => {
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        addresses,
        wishlist,
        login,
        register,
        logout,
        addAddress,
        updateAddress,
        deleteAddress,
        toggleWishlist
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
