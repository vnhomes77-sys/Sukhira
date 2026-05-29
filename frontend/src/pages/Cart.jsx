import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    couponCode,
    discountPercent,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscountAmount,
    getShippingCost,
    getTotal
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState({ success: false, message: '' });

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      const result = applyCoupon(couponInput);
      setCouponFeedback(result);
      if (result.success) {
        setCouponInput('');
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      alert('Please login or create an account to proceed to checkout!');
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <div style={{ background: 'var(--accent-light)', color: 'var(--accent-color)', width: '80px', height: '80px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <ShoppingBag size={36} />
        </div>
        <h1 style={{ marginBottom: '1rem' }}>Your Shopping Cart is Empty</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem auto' }}>
          Looks like you haven't added any seasonal products yet. Dive into our catalog to find items suited for your current weather!
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart ({cartItems.length} items)</h1>
      
      <div className="cart-layout">
        {/* Items Column */}
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item-row">
              <img src={item.images[0]} alt={item.name} className="cart-item-img" />
              
              <div className="cart-item-details">
                <Link to={`/product/${item.product_id}`} className="cart-item-name-link">
                  <h4 className="cart-item-name">{item.name}</h4>
                </Link>
                {item.variant && <div className="cart-item-variant">Option: {item.variant}</div>}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Season: {item.season}</div>
              </div>

              {/* Quantity Changer */}
              <div className="qty-selector" style={{ margin: '0 1rem' }}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="qty-btn"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <div className="qty-value">{item.quantity}</div>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="qty-btn"
                >
                  +
                </button>
              </div>

              {/* Pricing */}
              <div style={{ textAlign: 'right', minWidth: '90px' }}>
                <div className="cart-item-price">₹{item.price * item.quantity}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{item.price} each</div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeFromCart(item.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.4rem' }}
                title="Remove item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/" className="btn-secondary">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Pricing Summary Column */}
        <div className="cart-summary-card">
          <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
            Order Summary
          </h3>
          
          <div className="summary-row">
            <span>Price ({cartItems.reduce((a,b)=>a+b.quantity,0)} items)</span>
            <span>₹{getSubtotal()}</span>
          </div>

          {discountPercent > 0 && (
            <div className="summary-row" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
              <span>Seasonal Coupon ({discountPercent}%)</span>
              <span>-₹{getDiscountAmount()}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping Charges</span>
            <span>{getShippingCost() === 0 ? 'FREE' : `₹${getShippingCost()}`}</span>
          </div>
          {getShippingCost() > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.6rem', marginBottom: '1rem', textAlign: 'right' }}>
              Add ₹{1000 - (getSubtotal() - getDiscountAmount())} more for FREE shipping
            </p>
          )}

          <div className="summary-row total">
            <span>Order Total</span>
            <span>₹{getTotal()}</span>
          </div>

          {/* Coupon Code Section */}
          <form onSubmit={handleApplyCoupon} className="coupon-field">
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value);
                setCouponFeedback({ success: false, message: '' });
              }}
              disabled={couponCode !== ''}
            />
            {couponCode ? (
              <button
                type="button"
                onClick={removeCoupon}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}
              >
                Remove
              </button>
            ) : (
              <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Apply
              </button>
            )}
          </form>

          {couponFeedback.message && (
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: couponFeedback.success ? 'var(--accent-color)' : '#ef4444',
              marginBottom: '1rem'
            }}>
              {couponFeedback.message}
            </div>
          )}

          {couponCode && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', background: 'var(--bg-hover)', padding: '0.5rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
              Active Coupon: <strong style={{ color: 'var(--accent-color)' }}>{couponCode}</strong>
            </div>
          )}

          <button onClick={handleProceedToCheckout} className="btn-primary checkout-btn">
            <span>Proceed to Checkout</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
