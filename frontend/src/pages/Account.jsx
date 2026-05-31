import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../config';
import { User, Package, Heart, MapPin, Key, LogOut, Plus, Trash2, ArrowRight } from 'lucide-react';

const Account = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, addresses, addAddress, deleteAddress, wishlist, toggleWishlist } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Address creation form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrEmail, setAddrEmail] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');

  // Password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
    }
  }, [activeTab, user]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('suk_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      await addAddress({
        name: addrName,
        phone: addrPhone,
        email: addrEmail,
        address_line: addrLine,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        country: 'India',
        is_default: addresses.length === 0 ? 1 : 0
      });
      setShowAddressForm(false);
      setAddrName('');
      setAddrPhone('');
      setAddrEmail('');
      setAddrLine('');
      setAddrCity('');
      setAddrState('');
      setAddrPincode('');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification("New passwords don't match!", 'error');
      return;
    }
    showNotification('Password changed successfully! (Mocked)', 'success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRemoveWishlist = (e, prodId) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(prodId).catch((err) => showNotification(err.message, 'error'));
  };

  if (!user) return null;

  return (
    <div className="account-page">
      <div className="account-layout">
        {/* Sidebar Nav */}
        <aside className="account-sidebar">
          <ul className="account-sidebar-menu">
            <li
              onClick={() => handleTabChange('dashboard')}
              className={`account-sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <User size={16} />
              <span>Dashboard</span>
            </li>
            <li
              onClick={() => handleTabChange('orders')}
              className={`account-sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <Package size={16} />
              <span>My Orders</span>
            </li>
            <li
              onClick={() => handleTabChange('wishlist')}
              className={`account-sidebar-item ${activeTab === 'wishlist' ? 'active' : ''}`}
            >
              <Heart size={16} />
              <span>Wishlist</span>
            </li>
            <li
              onClick={() => handleTabChange('addresses')}
              className={`account-sidebar-item ${activeTab === 'addresses' ? 'active' : ''}`}
            >
              <MapPin size={16} />
              <span>Addresses</span>
            </li>

            <li
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="account-sidebar-item"
              style={{ color: '#ef4444' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </li>
          </ul>
        </aside>

        {/* Content Box */}
        <div className="account-dashboard-card">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
                Welcome, {user.name}!
              </h2>
              <div className="account-profile-grid">
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.8rem' }}>Profile Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> {user.name}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {user.email}</div>
                    {user.phone && <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {user.phone}</div>}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.8rem' }}>Account Activity</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Thank you for being a Sukhira customer. We optimize your clothing and skincare needs depending on the weather conditions outside!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
                My Orders
              </h2>
              {loadingOrders ? (
                <div>Loading orders list...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <Package size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p>You haven't placed any orders yet.</p>
                  <Link to="/" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Shop Now</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map((ord) => (
                    <div key={ord.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <div>
                          <strong>ID: {ord.order_id_str}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>
                            {new Date(ord.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div>
                          Status: <strong style={{ color: 'var(--accent-color)', textTransform: 'uppercase' }}>{ord.status}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '0.95rem' }}>Total: <strong>₹{ord.total}</strong> ({ord.payment_method})</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Est. Delivery: {ord.delivery_date}
                          </p>
                        </div>
                        <Link to={`/track/${ord.order_id_str}`} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          Track Order
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
                My Wishlist
              </h2>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <Heart size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p>Your wishlist is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {wishlist.map((item) => (
                    <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Link to={`/product/${item.product_id}`} style={{ position: 'relative', display: 'block', height: '180px' }}>
                        <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={(e) => handleRemoveWishlist(e, item.product_id)}
                          className="wishlist-toggle-btn active"
                          style={{ top: '8px', right: '8px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </Link>
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, height: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.name}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                          <span style={{ fontWeight: 700 }}>₹{item.price}</span>
                          <Link to={`/product/${item.product_id}`} style={{ fontSize: '0.8rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                            View <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.8rem' }}>
                  Saved Addresses
                </h2>
                {!showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="btn-primary" style={{ width: 'fit-content', flexGrow: 0, padding: '0.5rem 1rem' }}>
                    <Plus size={16} /> Add New Address
                  </button>
                )}
              </div>

              {showAddressForm && (
                <form onSubmit={handleCreateAddress} className="add-review-form" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '2rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Add Address</h4>
                  <div className="address-form-grid-2">
                    <div className="form-group">
                      <label>Contact Name</label>
                      <input type="text" placeholder="e.g. Rahul Sharma" value={addrName} onChange={(e) => setAddrName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" placeholder="10-digit number" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="e.g. rahul@gmail.com" value={addrEmail} onChange={(e) => setAddrEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Address Details (Flat/House No, Building, Area)</label>
                    <input type="text" placeholder="Address Details" value={addrLine} onChange={(e) => setAddrLine(e.target.value)} required />
                  </div>
                  <div className="address-form-grid-3">
                    <div className="form-group">
                      <label>City</label>
                      <input type="text" placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input type="text" placeholder="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Pincode</label>
                      <input type="text" placeholder="6-digit ZIP" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Address</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary" style={{ width: 'auto' }}>Cancel</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <MapPin size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p>No addresses saved yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="address-card-item">
                      <div>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{addr.name}</span>
                          {addr.is_default === 1 && <span style={{ fontSize: '0.65rem', background: 'var(--accent-color)', color: 'var(--bg-card)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Default</span>}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Phone: {addr.phone} | Email: {addr.email}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => deleteAddress(addr.id).catch((err) => showNotification(err.message, 'error'))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.5rem' }}
                        title="Delete Address"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Account;
