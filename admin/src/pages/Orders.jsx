import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  Search,
  ShoppingCart,
  Download,
  Eye,
  Truck,
  FileText,
  AlertCircle,
  X,
  User,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle,
  RefreshCw,
  Ban
} from 'lucide-react';


// SVG Barcode Generator Helper
const generateBarcodeSVG = (text) => {
  let bars = [];
  let currentX = 0;
  
  // Start guard
  bars.push({ x: currentX, width: 2, fill: 'black' }); currentX += 2;
  bars.push({ x: currentX, width: 1.5, fill: 'white' }); currentX += 1.5;
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // 6-bit pseudo barcode layout based on character ascii
    const pattern = [
      (charCode % 3) + 1,
      ((charCode >> 1) % 2) + 1,
      ((charCode >> 2) % 3) + 1,
      ((charCode >> 3) % 2) + 1,
      ((charCode >> 4) % 3) + 1,
      ((charCode >> 5) % 2) + 1
    ];
    
    for (let j = 0; j < pattern.length; j++) {
      const width = pattern[j] * 1.5;
      const isBlack = j % 2 === 0;
      bars.push({ x: currentX, width: width, fill: isBlack ? 'black' : 'white' });
      currentX += width;
    }
  }
  
  // Stop guard
  bars.push({ x: currentX, width: 2, fill: 'black' }); currentX += 2;
  bars.push({ x: currentX, width: 1.5, fill: 'white' }); currentX += 1.5;
  bars.push({ x: currentX, width: 2, fill: 'black' }); currentX += 2;
  
  return (
    <svg viewBox={`0 0 ${currentX} 60`} width="100%" height="45" preserveAspectRatio="none">
      {bars.map((bar, idx) => (
        <rect key={idx} x={bar.x} y={0} width={bar.width} height={60} fill={bar.fill === 'black' ? '#000000' : 'transparent'} />
      ))}
    </svg>
  );
};

// SVG QR Code Generator Helper
const generateQRCodeSVG = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const size = 25; // 25x25 grid
  const rects = [];
  
  const isPositionPattern = (r, c) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    if (r >= size - 5 && r <= size - 3 && c >= size - 5 && c <= size - 3) return true; // alignment-ish
    return false;
  };
  
  let seed = Math.abs(hash) || 123456789;
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isPositionPattern(r, c)) continue;
      
      // Timing patterns (row 6 and col 6 alternating)
      if (r === 6 || c === 6) {
        if ((r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) {
          rects.push(<rect key={`${r}-${c}`} x={c * 4} y={r * 4} width="4" height="4" fill="#000000" />);
        }
        continue;
      }
      
      if (lcg() > 0.43) {
        rects.push(<rect key={`${r}-${c}`} x={c * 4} y={r * 4} width="4" height="4" fill="#000000" />);
      }
    }
  }
  
  const renderCorner = (x, y) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width="28" height="28" fill="#000000" />
      <rect x="4" y="4" width="20" height="20" fill="#ffffff" />
      <rect x="8" y="8" width="12" height="12" fill="#000000" />
    </g>
  );
  
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
      {renderCorner(0, 0)}
      {renderCorner(72, 0)}
      {renderCorner(0, 72)}
      
      {/* Alignment block */}
      <g transform="translate(68, 68)">
        <rect x="0" y="0" width="12" height="12" fill="#000000" />
        <rect x="3" y="3" width="6" height="6" fill="#ffffff" />
        <rect x="5" y="5" width="2" height="2" fill="#000000" />
      </g>
      
      <g>{rects}</g>
    </svg>
  );
};

const Orders = () => {
  const { token, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation tabs: 'orders' or 'returns'
  const [activeTab, setActiveTab] = useState('orders');

  // Main lists states
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Order for drawer/modal details
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Selected Order for printable shipping label
  const [printLabelOrder, setPrintLabelOrder] = useState(null);
  const [labelCourier, setLabelCourier] = useState('DELHIVERY');
  const [labelWeight, setLabelWeight] = useState('0.45');
  const [labelDimensions, setLabelDimensions] = useState('18 x 15 x 6');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Logistics form state
  const [logisticsData, setLogisticsData] = useState({
    status: '',
    courier_name: '',
    tracking_number: ''
  });
  const [internalNotes, setInternalNotes] = useState('');

  const handleOpenPrintLabel = (order) => {
    setPrintLabelOrder(order);
    setLabelCourier(order.courier_name || 'DELHIVERY');
    setLabelWeight('0.45');
    setLabelDimensions('18 x 15 x 6');
  };

  const canEditLogistics = hasRole(['owner', 'manager', 'order_staff']);
  const canRefund = hasRole(['owner', 'manager']);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrdersAndReturns(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token]);

  // Handle URL direct queries for a specific order (e.g. ?id=5)
  useEffect(() => {
    const orderIdParam = searchParams.get('id');
    if (orderIdParam && orders.length) {
      const ord = orders.find(o => o.id === parseInt(orderIdParam));
      if (ord) {
        handleViewOrderDetails(ord);
        setSearchParams({});
      }
    }
  }, [searchParams, orders, setSearchParams]);

  const fetchOrdersAndReturns = async (signal) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Orders
      const ordResponse = await fetch(`${API_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!ordResponse.ok) throw new Error('Failed to load orders registry');
      const ordData = await ordResponse.json();
      setOrders(ordData);

      // 2. Fetch Returns
      const retResponse = await fetch(`${API_URL}/admin/returns`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (retResponse.ok) {
        const retData = await retResponse.json();
        setReturns(retData);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Error downloading logistics registries');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setLogisticsData({
      status: order.status,
      courier_name: order.courier_name || '',
      tracking_number: order.tracking_number || ''
    });
    setInternalNotes(order.internal_notes || '');
  };

  // Submit Logistics Update (status, courier, tracking)
  const handleUpdateLogistics = async (e) => {
    e.preventDefault();
    if (!canEditLogistics) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logisticsData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Logistics update failed');
      }

      setSuccessMsg('Logistics updated successfully');
      
      // Update state local
      setOrders(orders.map(o => o.id === selectedOrder.id ? { 
        ...o, 
        status: logisticsData.status, 
        courier_name: logisticsData.courier_name,
        tracking_number: logisticsData.tracking_number
      } : o));
      
      // Update selected order view
      setSelectedOrder(prev => ({
        ...prev,
        status: logisticsData.status,
        courier_name: logisticsData.courier_name,
        tracking_number: logisticsData.tracking_number
      }));

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating order logistics');
    }
  };

  // Submit Internal Notes Update
  const handleUpdateNotes = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/orders/${selectedOrder.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ internal_notes: internalNotes })
      });

      if (!response.ok) throw new Error('Failed to update internal notes');

      setSuccessMsg('Internal notes saved successfully');
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, internal_notes: internalNotes } : o));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error saving internal notes');
    }
  };

  // Cancel order directly
  const handleCancelOrder = async () => {
    if (!canEditLogistics) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Cancellation request failed');

      setSuccessMsg('Order cancelled successfully');
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o));
      
      // Update drawer status local
      setLogisticsData(prev => ({ ...prev, status: 'cancelled' }));
      setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error canceling order');
    }
  };

  // Handle Returns queue (refund approve / reject status)
  const handleUpdateReturnStatus = async (id, statusVal) => {
    if (!canRefund) return;
    if (!window.confirm(`Are you sure you want to resolve this return as "${statusVal}"?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/returns/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusVal })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update return queue status');
      }

      setSuccessMsg(`Return request solved successfully: ${statusVal}`);
      
      // Update local returns state
      setReturns(returns.map(r => r.id === id ? { ...r, status: statusVal } : r));
      
      // Reload orders to reflect status updates
      fetchOrdersAndReturns();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error resolving return request');
    }
  };

  // CSV Exporter for logistic listings
  const exportToCSV = () => {
    if (!filteredOrders.length) return;

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Total Amount',
      'Payment Status',
      'Order Status',
      'Courier',
      'Tracking Number',
      'Street Address',
      'City',
      'State',
      'Postal Code'
    ];

    const rows = filteredOrders.map(o => [
      `SK${o.id}`,
      new Date(o.created_at).toLocaleDateString(),
      o.customer_name,
      o.customer_email,
      o.customer_phone || '',
      o.total,
      o.payment_status,
      o.status,
      o.courier_name || '',
      o.tracking_number || '',
      o.shipping_address?.street || '',
      o.shipping_address?.city || '',
      o.shipping_address?.state || '',
      o.shipping_address?.postal_code || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sukhira_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters computed
  const filteredOrders = orders.filter(o => {
    const matchesSearch = `SK${o.id}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || o.status === statusFilter;
    const matchesPayment = !paymentFilter || o.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
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

      {/* Tabs selectors */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'orders' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Customer Orders
          {activeTab === 'orders' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'returns' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Returns Queue
          {activeTab === 'returns' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Filters Area */}
          <div className="catalog-toolbar">
            <div className="toolbar-search">
              <Search size={18} className="toolbar-search-icon" />
              <input
                type="text"
                placeholder="Search Order ID (#SK12), Client..."
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
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                className="filter-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>

              <button className="btn-secondary" onClick={exportToCSV} disabled={!filteredOrders.length}>
                <Download size={18} />
                <span>Export Logistics CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Listing Grid */}
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
                    <th>Order ID</th>
                    <th>Customer Info</th>
                    <th>Date</th>
                    <th>Total Price</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Logistics Courier</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!filteredOrders.length ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No orders matching active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>#SK{o.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.customer_email}</div>
                        </td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 700 }}>{formatINR(o.total)}</td>
                        <td>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, textTransform: 'uppercase' }}>
                            {o.payment_method}
                          </span>
                          <span className={`badge ${o.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            o.status === 'delivered' ? 'badge-success' :
                            o.status === 'cancelled' || o.status === 'refunded' ? 'badge-danger' :
                            o.status === 'shipped' || o.status === 'out_for_delivery' ? 'badge-info' :
                            'badge-warning'
                          }`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {o.courier_name ? (
                            <div>
                              <div style={{ fontWeight: 500 }}>{o.courier_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.tracking_number}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Assign</span>
                          )}
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }} onClick={() => handleViewOrderDetails(o)}>
                            <Eye size={14} style={{ marginRight: '0.3rem' }} />
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Returns Registry */
        <>
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
                    <th>Return ID</th>
                    <th>Order Code</th>
                    <th>Customer Name</th>
                    <th>Reason</th>
                    <th>Total Worth</th>
                    <th>Request Status</th>
                    <th>Created At</th>
                    {canRefund && <th>Operations</th>}
                  </tr>
                </thead>
                <tbody>
                  {!returns.length ? (
                    <tr>
                      <td colSpan={canRefund ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No return applications filed.
                      </td>
                    </tr>
                  ) : (
                    returns.map((ret) => (
                      <tr key={ret.id}>
                        <td style={{ fontWeight: 700 }}>#RET{ret.id}</td>
                        <td style={{ fontWeight: 600 }}>#{ret.order_id_str || `SK${ret.order_id}`}</td>
                        <td>{ret.customer_name}</td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{ret.reason_category || 'Skincare Issue'}: </span>
                          <span>{ret.reason}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatINR(ret.total)}</td>
                        <td>
                          <span className={`badge ${
                            ret.status === 'refunded' || ret.status === 'approved' ? 'badge-success' :
                            ret.status === 'rejected' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {ret.status}
                          </span>
                        </td>
                        <td>{new Date(ret.created_at || Date.now()).toLocaleDateString()}</td>
                        {canRefund && (
                          <td>
                            {ret.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="btn-success"
                                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                                  onClick={() => handleUpdateReturnStatus(ret.id, 'refunded')}
                                >
                                  Refund Client
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                                  onClick={() => handleUpdateReturnStatus(ret.id, 'rejected')}
                                >
                                  Reject Request
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Solved
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* View Order Detail Modal Drawer */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Order details #SK{selectedOrder.id}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              {/* Left Column: Details, Items */}
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ color: 'var(--accent-color)' }}><User size={20} /></div>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700 }}>Customer Registry</h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', fontWeight: 600 }}>{selectedOrder.customer_name}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email: {selectedOrder.customer_email}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {selectedOrder.customer_phone}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ color: 'var(--accent-color)' }}><MapPin size={20} /></div>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700 }}>Shipping Destination</h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {selectedOrder.shipping_address?.street}<br />
                      {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postal_code}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ color: 'var(--accent-color)' }}><CreditCard size={20} /></div>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '0.6rem' }}>Purchased Products</h4>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0' }}>
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=80'}
                        alt={item.name}
                        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Qty: {item.quantity} × {formatINR(item.price)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {formatINR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.8rem', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.98rem' }}>
                    <span>Order Total:</span>
                    <span>{formatINR(selectedOrder.total)}</span>
                  </div>

                  {/* Shipping Label Trigger Button */}
                  <button 
                    type="button"
                    className="btn-primary no-print" 
                    style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => handleOpenPrintLabel(selectedOrder)}
                  >
                    <FileText size={18} />
                    <span>Print Shipping Label</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Logistics and Internal Notes Forms */}
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={18} />
                  Fulfillment Status
                </h4>

                <form onSubmit={handleUpdateLogistics}>
                  <div className="form-group">
                    <label>Fulfillment Stage</label>
                    <select
                      className="form-control"
                      value={logisticsData.status}
                      onChange={(e) => setLogisticsData({ ...logisticsData, status: e.target.value })}
                      disabled={!canEditLogistics || ['cancelled', 'refunded'].includes(selectedOrder.status)}
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled" disabled>Cancelled</option>
                      <option value="refunded" disabled>Refunded</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Logistics Partner (Courier)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Delhivery, Bluedart"
                      value={logisticsData.courier_name}
                      onChange={(e) => setLogisticsData({ ...logisticsData, courier_name: e.target.value })}
                      disabled={!canEditLogistics || ['cancelled', 'refunded'].includes(selectedOrder.status)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Logistics Tracking Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TRK18402517"
                      value={logisticsData.tracking_number}
                      onChange={(e) => setLogisticsData({ ...logisticsData, tracking_number: e.target.value })}
                      disabled={!canEditLogistics || ['cancelled', 'refunded'].includes(selectedOrder.status)}
                    />
                  </div>

                  {canEditLogistics && !['cancelled', 'refunded'].includes(selectedOrder.status) && (
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>
                      Save Logistics Details
                    </button>
                  )}
                </form>

                {/* Internal Notes */}
                <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <FileText size={18} />
                  Internal Private Notes
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  These comments are only visible to store managers and staff. Clients will never see them.
                </p>

                <textarea
                  className="form-control"
                  style={{ minHeight: '80px', fontSize: '0.85rem', marginBottom: '0.8rem' }}
                  placeholder="Type internal remarks..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
                
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', marginBottom: '1.5rem', fontSize: '0.82rem' }}
                  onClick={handleUpdateNotes}
                >
                  Save Internal Note
                </button>

                {/* Emergency Cancel Action */}
                {canEditLogistics && !['delivered', 'cancelled', 'refunded'].includes(selectedOrder.status) && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn-danger" style={{ width: '100%', fontSize: '0.82rem' }} onClick={handleCancelOrder}>
                      <Ban size={14} style={{ marginRight: '0.4rem' }} />
                      Void & Cancel Order
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Label Printable Modal */}
      {printLabelOrder && (() => {
        const trackingNumber = printLabelOrder.tracking_number || `TRK${printLabelOrder.id}9382`;

        // Calculate billable weight
        const wActual = parseFloat(labelWeight) || 0.45;
        const dims = labelDimensions.split('x').map(x => parseFloat(x.trim()) || 0);
        const length = dims[0] || 0;
        const width = dims[1] || 0;
        const height = dims[2] || 0;
        const wVolumetric = (length * width * height) / 5000;
        const wBillable = Math.max(wActual, wVolumetric);

        // Logistics partners comparison rates
        const couriersList = [
          { name: 'DELHIVERY', displayName: 'Delhivery', base: 45, perKg: 35, speed: '2-4 Days' },
          { name: 'EKART', displayName: 'Ekart Logistics', base: 40, perKg: 30, speed: '3-5 Days' },
          { name: 'XPRESSBEES', displayName: 'Xpressbees', base: 38, perKg: 32, speed: '3-6 Days' },
          { name: 'BLUEDART', displayName: 'BlueDart Air', base: 75, perKg: 50, speed: '1-2 Days' },
          { name: 'INDIAPOST', displayName: 'India Post (Speed Post)', base: 25, perKg: 20, speed: '4-7 Days' }
        ];

        const computedCouriers = couriersList.map(c => ({
          ...c,
          cost: Math.round(c.base + wBillable * c.perKg)
        }));

        const cheapestCost = Math.min(...computedCouriers.map(c => c.cost));

        return (
          <div className="modal-overlay no-print-bg shipping-label-overlay">
            <div className="modal-container shipping-label-modal" style={{ maxWidth: '800px', backgroundColor: '#f9fafb' }}>
              <div className="modal-header no-print">
                <h3>Logistics Rate Calculator & Label Generator</h3>
                <button className="modal-close-btn" onClick={() => setPrintLabelOrder(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* Package Specs Input & Rate comparison grid - Hidden when printing */}
              <div className="no-print" style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--accent-color)' }}>1. Package Metrics & Cost Calculator</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.2rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Actual Package Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control" 
                      value={labelWeight}
                      onChange={(e) => setLabelWeight(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Dimensions (L x W x H in cm)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 18 x 15 x 6"
                      value={labelDimensions}
                      onChange={(e) => setLabelDimensions(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', padding: '0.6rem 0.8rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1e40af', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Volumetric Weight: <strong>{wVolumetric.toFixed(3)} kg</strong> <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>(L*W*H/5000)</span></span>
                  <span>Billable Charging Weight: <strong>{wBillable.toFixed(3)} kg</strong></span>
                </div>

                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.6rem' }}>Select Logistics Courier Partner:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
                  {computedCouriers.map(c => {
                    const isSelected = labelCourier === c.name;
                    const isCheapest = c.cost === cheapestCost;
                    return (
                      <div 
                        key={c.name}
                        onClick={() => setLabelCourier(c.name)}
                        style={{
                          border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.8rem',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--accent-light)' : '#ffffff',
                          transition: 'all 0.2s',
                          position: 'relative',
                          textAlign: 'center'
                        }}
                      >
                        {isCheapest && (
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '10px',
                            whiteSpace: 'nowrap'
                          }}>
                            CHEAPEST
                          </span>
                        )}
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? 'var(--accent-color)' : 'var(--text-main)' }}>{c.displayName}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.3rem 0', color: isSelected ? 'var(--accent-color)' : 'var(--text-main)' }}>
                          ₹{c.cost}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.speed}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h4 className="no-print" style={{ margin: '1.5rem 0 0.8rem 0', fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--accent-color)' }}>2. Label Preview & Print</h4>
              
              {/* Printable Area */}
              <div className="shipping-label-wrapper" id="printable-shipping-label">
                <div className="shipping-label-card">
                  {/* Header Section: Seller Branding & Routing Info */}
                  <div className="label-header">
                    <div className="label-brand">
                      <h2>SUKHIRA</h2>
                      <span>Seasonal Direct-to-Consumer</span>
                    </div>
                    <div className="label-courier-box">
                      <span className="courier-title">{labelCourier} LOGISTICS</span>
                      <span className="routing-code">
                        {labelCourier === 'DELHIVERY' && `DEL/DWK-${printLabelOrder.shipping_address?.postal_code || '110075'}`}
                        {labelCourier === 'EKART' && `EK/MUM-${printLabelOrder.shipping_address?.postal_code || '400001'}`}
                        {labelCourier === 'XPRESSBEES' && `XB/BLR-${printLabelOrder.shipping_address?.postal_code || '560001'}`}
                        {labelCourier === 'BLUEDART' && `BD/DEL-${printLabelOrder.shipping_address?.postal_code || '110075'}`}
                        {labelCourier === 'INDIAPOST' && `IP/IND-${printLabelOrder.shipping_address?.postal_code || '110001'}`}
                      </span>
                    </div>
                  </div>

                  {/* Primary Barcode Section: AWB Tracking Code */}
                  <div className="label-barcode-section">
                    <div className="barcode-container">
                      {generateBarcodeSVG(trackingNumber)}
                    </div>
                    <span className="barcode-text">AWB No: {trackingNumber}</span>
                  </div>

                  {/* Middle Grid: SHIP TO on left, QR Code + Details on right */}
                  <div className="label-address-grid">
                    <div className="label-ship-to">
                      <span className="address-header">DELIVERY ADDRESS (SHIP TO)</span>
                      <strong className="customer-name">{printLabelOrder.customer_name}</strong>
                      <p className="customer-address">
                        {printLabelOrder.shipping_address?.street},<br />
                        {printLabelOrder.shipping_address?.city}, {printLabelOrder.shipping_address?.state}
                      </p>
                      <div className="pincode-bold-box">
                        PINCODE: <strong>{printLabelOrder.shipping_address?.postal_code}</strong>
                      </div>
                      <p className="customer-phone"><strong>Phone:</strong> {printLabelOrder.customer_phone}</p>
                    </div>

                    <div className="label-right-block">
                      <div className="label-qrcode-container">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://sukhira.com/track?awb=${trackingNumber}`)}`} 
                          alt="QR Code"
                          style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                      </div>
                      <div className="package-spec-block">
                        <div><strong>Weight:</strong> {labelWeight} kg</div>
                        <div><strong>Dims:</strong> {labelDimensions} cm</div>
                        <div><strong>Box:</strong> 1 of 1</div>
                      </div>
                    </div>
                  </div>

                  {/* Seller & Invoice info */}
                  <div className="label-invoice-row">
                    <div className="label-sold-by">
                      <span className="address-header">RETURN ADDRESS (SOLD BY)</span>
                      <strong>SUKHIRA WAREHOUSE</strong>
                      <p>Plot No. 42, Sector 18, Dwarka, New Delhi - 110075</p>
                      <p>GSTIN: 07AAACS9382M1Z0</p>
                    </div>
                    <div className="label-invoice-details">
                      <div><strong>Inv No:</strong> INV-{printLabelOrder.id * 103 + 4900}</div>
                      <div><strong>Inv Date:</strong> {new Date(printLabelOrder.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Payment Box (High contrast Flipkart/Meesho/Amazon style COD/Prepaid) */}
                  <div className={`label-payment-status ${printLabelOrder.payment_method === 'COD' ? 'cod-box' : 'prepaid-box'}`}>
                    <div className="payment-badge">
                      {printLabelOrder.payment_method === 'COD' ? 'COD' : 'PREPAID'}
                    </div>
                    <div className="payment-amount-collect">
                      {printLabelOrder.payment_method === 'COD' 
                        ? `COLLECT CASH: ₹${printLabelOrder.total.toFixed(2)}` 
                        : 'DO NOT COLLECT CASH - PAID ONLINE'}
                    </div>
                  </div>

                  {/* Packing Slip Table (Product Summary Checklist) */}
                  <div className="label-pack-slip">
                    <span className="address-header">PACKAGE CONTENT SUMMARY (PACKING LIST)</span>
                    <table className="pack-slip-table">
                      <thead>
                        <tr>
                          <th>Product Title</th>
                          <th>Variant/Size</th>
                          <th style={{ textAlign: 'center' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printLabelOrder.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="item-name-cell">{item.name}</td>
                            <td>{item.variant || 'Standard'}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Small Declaration Footer */}
                  <div className="label-footer-declaration">
                    <strong>Declaration:</strong> The goods sold are intended for end-consumer consumption. Fits on standard package box.
                    This is a computer-generated label, requires no physical signature.
                  </div>

                  {/* Secondary Barcode for Order ID */}
                  <div className="label-order-barcode">
                    {generateBarcodeSVG(`SK-${printLabelOrder.id}`)}
                    <span className="order-barcode-text">Order ID: SK-{printLabelOrder.id}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => window.print()}
                >
                  Print Label (PDF)
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => setPrintLabelOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Orders;
