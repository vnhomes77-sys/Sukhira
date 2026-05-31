import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Search, PhoneCall, HelpCircle, AlertCircle, Settings, Truck, MapPin, Warehouse } from 'lucide-react';
import { API_URL } from '../config';

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
      const res = await fetch(`${API_URL}/orders/${idStr}`);
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

          {/* Interactive logistics details bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>Logistics: </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                {order.courier_name || 'Standard Courier'} ({order.tracking_number || 'Pending AWB Assignment'})
              </span>
            </div>
          </div>

          {/* SVG Route Map */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '2rem 1.5rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)', textAlign: 'center', position: 'relative' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Truck size={18} style={{ color: 'var(--accent-color)' }} /> Live Transit Route Map
            </h4>
            <div style={{ overflowX: 'auto', padding: '1rem 0' }}>
              <svg viewBox="0 0 600 120" style={{ minWidth: '550px', height: '100px', display: 'block', margin: '0 auto' }}>
                {/* Gray Track Path */}
                <line x1="60" y1="60" x2="540" y2="60" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
                
                {/* Active Colored Track Path */}
                <line 
                  x1="60" 
                  y1="60" 
                  x2={60 + Math.min(activeIdx, 4) * 120} 
                  y2="60" 
                  stroke="var(--accent-color)" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  style={{ transition: 'x2 0.8s ease-in-out' }}
                />

                {/* Tracking nodes */}
                {[
                  { x: 60, label: 'Warehouse', city: 'Noida Central' },
                  { x: 180, label: 'Approved', city: 'Delhi Hub' },
                  { x: 300, label: 'Packed', city: 'Sorting Facility' },
                  { x: 420, label: 'In Transit', city: 'Outbound Truck' },
                  { x: 540, label: 'Delivered', city: order.shipping_address?.city || 'Destination' }
                ].map((node, index) => {
                  const nodeActive = index <= activeIdx;
                  const isCurrentNode = index === activeIdx || (index === 4 && activeIdx === 5);
                  return (
                    <g key={index}>
                      {/* Node Glow ring */}
                      {isCurrentNode && (
                        <circle 
                          cx={node.x} 
                          cy="60" 
                          r="14" 
                          fill="none" 
                          stroke="var(--accent-color)" 
                          strokeWidth="2" 
                          style={{ opacity: 0.4, transformOrigin: `${node.x}px 60px`, animation: 'pulse 2s infinite' }}
                        />
                      )}
                      {/* Node Circle */}
                      <circle 
                        cx={node.x} 
                        cy="60" 
                        r="8" 
                        fill={nodeActive ? 'var(--accent-color)' : 'var(--bg-card)'} 
                        stroke={nodeActive ? 'var(--accent-color)' : 'var(--border-color)'} 
                        strokeWidth="3" 
                      />
                      {/* Node Text Info */}
                      <text x={node.x} y="30" textAnchor="middle" style={{ fontSize: '0.75rem', fontWeight: 800, fill: nodeActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {node.label}
                      </text>
                      <text x={node.x} y="90" textAnchor="middle" style={{ fontSize: '0.7rem', fontWeight: 500, fill: 'var(--text-muted)' }}>
                        {node.city}
                      </text>
                    </g>
                  );
                })}

                {/* Flying Cargo Truck icon on active location */}
                {activeIdx >= 0 && activeIdx < 5 && (
                  <g style={{ transform: `translateX(${60 + activeIdx * 120 - 12}px) translateY(44px)`, transition: 'transform 0.8s ease-in-out' }}>
                    <rect width="24" height="24" rx="12" fill="var(--accent-color)" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                    <svg viewBox="0 0 24 24" width="14" height="14" x="5" y="5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </g>
                )}
                {/* Map pin at destination when delivered */}
                {activeIdx === 5 && (
                  <g style={{ transform: `translateX(528px) translateY(44px)` }}>
                    <rect width="24" height="24" rx="12" fill="#10b981" />
                    <svg viewBox="0 0 24 24" width="14" height="14" x="5" y="5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </g>
                )}
              </svg>
            </div>
            {/* Simulated Live Route Checkpoint updates */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {activeIdx === 0 && <p>📦 <strong>Checkpoint Status:</strong> Order details submitted at Central Warehouse Noida. Courier partner pickup scheduled.</p>}
              {activeIdx === 1 && <p>🛡️ <strong>Checkpoint Status:</strong> Seller approved. Package labeled and awaiting transit manifest release.</p>}
              {activeIdx === 2 && <p>📦 <strong>Checkpoint Status:</strong> Packed and ready. Dispatched from sorting center to outbound transit vehicle.</p>}
              {activeIdx === 3 && <p>🚚 <strong>Checkpoint Status:</strong> In transit via interstate highway route to recipient's local sorting hub.</p>}
              {activeIdx === 4 && <p>🛵 <strong>Checkpoint Status:</strong> Out for delivery. Delivery executive is heading to customer address. Drive Speed: 38 km/h.</p>}
              {activeIdx === 5 && <p>✅ <strong>Checkpoint Status:</strong> Delivered. Package received at customer destination. Thank you for shopping with Sukhira!</p>}
            </div>
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
