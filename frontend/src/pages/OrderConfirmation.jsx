import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Package, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

const OrderConfirmation = () => {
  const { orderIdStr } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderIdStr]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderIdStr}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error('Error fetching order confirmation details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '10rem' }}>Loading confirmation summary...</div>;
  }

  return (
    <div className="confirmation-page">
      <div className="success-icon-circle">
        <CheckCircle size={40} />
      </div>
      
      <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2.5rem', marginBottom: '0.8rem', color: 'var(--text-main)' }}>
        Order Confirmed!
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
        Thank you for shopping at Sukhira. Your order has been placed successfully and is being prepared.
      </p>

      {order && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '2rem', textAlign: 'left', marginBottom: '3rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)' }}>
            Order Details
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order Reference:</span>
            <strong>{order.order_id_str}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'var(--accent-color)' }}>
              <Calendar size={15} />
              {order.delivery_date}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
            <strong>₹{order.total} ({order.payment_method})</strong>
          </div>

          <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.8rem' }}>Items Ordered:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span>{item.name} {item.variant && `(${item.variant})`} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link to={`/track/${orderIdStr}`} className="btn-primary">
          <Package size={18} />
          <span>Track Your Order</span>
        </Link>
        <Link to="/" className="btn-secondary">
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
