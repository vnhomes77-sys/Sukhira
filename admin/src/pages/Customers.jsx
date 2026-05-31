import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  Search,
  Users,
  ShieldAlert,
  Calendar,
  Lock,
  Unlock,
  Eye,
  X,
  CreditCard,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

const Customers = () => {
  const { token, hasRole } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected customer details modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canEdit = hasRole(['owner', 'manager']);

  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token]);

  const fetchCustomers = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!response.ok) throw new Error('Failed to load customer list');
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Error loading customers registry');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!canEdit) return;
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    
    if (!window.confirm(`Are you sure you want to change this customer's status to ${newStatus}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/customers/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to modify customer status');

      // Update local state list
      setCustomers(customers.map(c => c.id === id ? { ...c, status: newStatus } : c));
      
      // Update modal data if open
      if (selectedCustomerData && selectedCustomerData.customer.id === id) {
        setSelectedCustomerData(prev => ({
          ...prev,
          customer: { ...prev.customer, status: newStatus }
        }));
      }

      setSuccessMsg(`Customer status changed to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setError(err.message || 'Error updating customer status');
    }
  };

  const handleViewCustomerDetails = async (id) => {
    setSelectedCustomerId(id);
    setModalLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/customers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load customer profile detail');
      const data = await response.json();
      setSelectedCustomerData(data);
    } catch (err) {
      console.error(err);
      setError('Could not download customer history: ' + err.message);
      setSelectedCustomerId(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerData(null);
  };

  // Filter computation
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.phone && c.phone.includes(searchQuery));
    
    const matchesStatus = !statusFilter || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div>
      {/* Notifications */}
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--color-success)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="catalog-toolbar">
        <div className="toolbar-search">
          <Search size={18} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Main Customers List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Client Details</th>
                <th>Phone Number</th>
                <th>Join Date</th>
                <th style={{ textAlign: 'center' }}>Total Orders</th>
                <th>Total Spent</th>
                <th>Status Toggle</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredCustomers.length ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No customer registry found matching active query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>#USR{c.id}</td>
                    <td>
                      <div style={{ fontWeight: 650, fontSize: '0.94rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td>{c.phone || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>no phone</span>}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.total_orders}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                      {formatINR(c.total_spent)}
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginRight: '0.4rem' }}>
                        {c.status}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: c.status === 'active' ? 'var(--color-danger)' : 'var(--color-success)',
                            padding: '0.2rem',
                            verticalAlign: 'middle'
                          }}
                          title={c.status === 'active' ? 'Block Customer' : 'Unblock Customer'}
                        >
                          {c.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      )}
                    </td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleViewCustomerDetails(c.id)}>
                        <Eye size={14} style={{ marginRight: '0.3rem' }} />
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer details modal */}
      {selectedCustomerId && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Customer History Dashboard</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {modalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(59, 130, 246, 0.2)',
                    borderTop: '3px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
              ) : selectedCustomerData ? (
                <div>
                  {/* Basic summary header */}
                  <div style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)' }}>
                        {selectedCustomerData.customer.name}
                      </h4>
                      <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        {selectedCustomerData.customer.email}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        {selectedCustomerData.customer.phone || 'No phone number'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        User ID: <strong>#USR{selectedCustomerData.customer.id}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Member Since: <strong>{new Date(selectedCustomerData.customer.created_at).toLocaleDateString()}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Status Badge: <strong style={{
                          color: selectedCustomerData.customer.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>{selectedCustomerData.customer.status.toUpperCase()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Registered Delivery Addresses */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{
                      color: 'var(--accent-color)',
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <MapPin size={18} />
                      Registered Delivery Locations ({selectedCustomerData.addresses?.length || 0})
                    </h4>

                    {!selectedCustomerData.addresses?.length ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        No shipping address records found for this account.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        {selectedCustomerData.addresses.map((addr) => (
                          <div key={addr.id} style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '1rem',
                            fontSize: '0.82rem',
                            position: 'relative'
                          }}>
                            {addr.is_default === 1 && (
                              <span className="badge badge-success" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.65rem' }}>
                                Default
                              </span>
                            )}
                            <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{addr.name || 'Saved Address'}</div>
                            <div>{addr.street}</div>
                            <div>{addr.city}, {addr.state}</div>
                            <div>Postal Code: {addr.postal_code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Orders */}
                  <div>
                    <h4 style={{
                      color: 'var(--accent-color)',
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CreditCard size={18} />
                      Order history ({selectedCustomerData.orders?.length || 0})
                    </h4>

                    {!selectedCustomerData.orders?.length ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        This client hasn't placed any order transactions.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Payment Status</th>
                              <th>Total Amount</th>
                              <th>Delivery Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCustomerData.orders.map((ord) => (
                              <tr key={ord.id}>
                                <td style={{ fontWeight: 700 }}>#SK{ord.id}</td>
                                <td>{new Date(ord.created_at).toLocaleDateString()}</td>
                                <td>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ord.payment_method.toUpperCase()}</span> • 
                                  <span style={{ fontSize: '0.8rem', color: ord.payment_status === 'paid' ? 'var(--color-success)' : 'var(--color-warning)', marginLeft: '0.3rem' }}>
                                    {ord.payment_status}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 650 }}>{formatINR(ord.total)}</td>
                                <td>
                                  <span className={`badge ${
                                    ord.status === 'delivered' ? 'badge-success' :
                                    ord.status === 'cancelled' || ord.status === 'refunded' ? 'badge-danger' :
                                    'badge-warning'
                                  }`} style={{ fontSize: '0.74rem' }}>
                                    {ord.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModal}>
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
