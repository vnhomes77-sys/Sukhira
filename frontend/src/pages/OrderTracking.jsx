import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Search, PhoneCall, HelpCircle, AlertCircle } from 'lucide-react';

const OrderTracking = () => {
  const { orderIdStr } = useParams();
  const [searchQuery, setSearchQuery] = useState(orderIdStr || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderIdStr) {
      trackOrder(orderIdStr);
    }
  }, [orderIdStr]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackOrder(searchQuery.trim());
    }
  };

  const trackOrder = async (idStr) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${idStr}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setOrder(null);
        setError('Order not found. Please double check the Reference ID.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('An error occurred while tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to map order status to step indices
  const getStatusIndex = (status) => {
    const stepsOrder = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    return stepsOrder.indexOf(status.toLowerCase());
  };

  // Development simulation function to advance status for demonstration
  const simulateAdvanceStatus = async () => {
    if (!order) return;
    const stepsOrder = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = stepsOrder.indexOf(order.status);
    if (currentIdx === stepsOrder.length - 1) return; // already delivered
    
    const nextStatus = stepsOrder[currentIdx + 1];
    
    // Express doesn't have an update route in server.js but we can mock it on screen or write a quick state change
    setOrder({
      ...order,
      status: nextStatus
    });
  };

  const steps = [
    { title: 'Order Placed', desc: 'Your order has been registered in our system.' },
    { title: 'Confirmed', desc: 'Payment verified and order approved by Sukhira.' },
    { title: 'Packed', desc: 'Items carefully selected and packed for transit.' },
    { title: 'Shipped', desc: 'Order handed over to our delivery logistics partner.' },
    { title: 'Out for Delivery', desc: 'Delivery executive is bringing the package to your doorstep.' },
    { title: 'Delivered', desc: 'Package successfully delivered and received!' }
  ];

  const activeIdx = order ? getStatusIndex(order.status) : -1;

  return (
    <div className="tracking-page">
      <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Track Your Order
      </h1>

      {/* Reference Search Input */}
      <form onSubmit={handleSearchSubmit} className="tracking-search-bar">
        <Search size={22} className="text-muted" />
        <input
          type="text"
          placeholder="Enter Order ID (e.g. SUK-20260529-XXXX)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0.6rem 2rem', width: 'auto' }}>
          Track
        </button>
      </form>

      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Fetching live tracking details...</div>}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '1.5rem', borderRadius: 'var(--border-radius)', display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '3rem' }}>
          <AlertCircle size={22} />
          <span>{error}</span>
        </div>
      )}

      {order && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800 }}>ID: {order.order_id_str}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Placed on: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Est. Delivery:</span>
              <div style={{ fontWeight: 800, color: 'var(--accent-color)' }}>{order.delivery_date}</div>
            </div>
          </div>

          {/* Interactive simulator button */}
          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <button
              onClick={simulateAdvanceStatus}
              disabled={order.status === 'delivered'}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
            >
              ⚙ Simulate Next Delivery Step
            </button>
          </div>

          {/* Status Timeline */}
          <div className="tracking-timeline">
            {steps.map((step, idx) => {
              const isActive = idx <= activeIdx;
              const isCurrent = idx === activeIdx;
              return (
                <div
                  key={idx}
                  className={`tracking-timeline-item ${isActive ? 'active' : ''}`}
                  style={{ opacity: isActive ? 1 : 0.5 }}
                >
                  <div className="timeline-dot" />
                  <h4 className="timeline-title" style={{ color: isCurrent ? 'var(--accent-color)' : 'var(--text-main)' }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Delivery Details Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '1.8rem', marginTop: '3rem', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
              Shipping Address
            </h4>
            <p style={{ fontWeight: 700 }}>{order.shipping_address.name}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {order.shipping_address.address_line}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Phone: {order.shipping_address.phone}
            </p>
          </div>

          {/* Support Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            <a href="tel:+919876543210" className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}>
              <PhoneCall size={18} />
              <span>Call Logistics Support</span>
            </a>
            <Link to="/contact" className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}>
              <HelpCircle size={18} />
              <span>Raise Ticket</span>
            </Link>
          </div>
        </div>
      )}

      {!order && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <p>Please enter your 16-character Reference Code above to trace the shipping timeline.</p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
