import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../config';
import { Check, CreditCard, Landmark, Truck, ShieldCheck, MapPin } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getSubtotal, getDiscountAmount, getShippingCost, getTotal, clearCart, couponCode } = useCart();
  const { addresses, addAddress, user } = useAuth();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1); // 1 = Address, 2 = Summary, 3 = Payment
  
  // Selected Address State
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.length > 0 ? addresses.find((a) => a.is_default)?.id || addresses[0].id : null
  );

  // New Address Form State
  const [showNewAddressForm, setShowNewAddressForm] = useState(addresses.length === 0);
  const [newName, setNewName] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newCountry, setNewCountry] = useState('India');

  // Payment Option State
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, ONLINE
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderData, setMockOrderData] = useState(null);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone || !newEmail || !newAddressLine || !newCity || !newState || !newPincode) {
      showNotification('Please fill out all address fields.', 'error');
      return;
    }
    try {
      await addAddress({
        name: newName,
        phone: newPhone,
        email: newEmail,
        address_line: newAddressLine,
        city: newCity,
        state: newState,
        pincode: newPincode,
        country: newCountry,
        is_default: addresses.length === 0 ? 1 : 0
      });
      // Reset form and select the new address (the latest address will be added)
      setShowNewAddressForm(false);
      // Selected address will default to the newly loaded list in state
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Helper to sync selection if addresses update
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const handleVerifyMockPayment = async () => {
    if (!mockOrderData || !selectedAddress) return;
    setShowMockModal(false);
    setPlacingOrder(true);
    try {
      const verifyRes = await fetch(`${API_URL}/orders/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('suk_token')}`
        },
        body: JSON.stringify({
          razorpay_order_id: mockOrderData.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
          razorpay_signature: 'mock_signature',
          address_id: selectedAddress.id,
          payment_method: 'RAZORPAY',
          discount: getDiscountAmount(),
          subtotal: getSubtotal(),
          shipping_cost: getShippingCost(),
          total: getTotal()
        })
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        clearCart();
        navigate(`/confirmation/${verifyData.order_id_str}`);
      } else {
        const verifyData = await verifyRes.json();
        showNotification(verifyData.message || 'Mock payment verification failed', 'error');
      }
    } catch (err) {
      console.error('Error during mock signature verification:', err);
      showNotification('An error occurred during mock payment verification.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showNotification('Please select or add a shipping address.', 'error');
      setStep(1);
      return;
    }
    setPlacingOrder(true);

    if (paymentMethod === 'ONLINE') {
      try {
        // 1. Load Razorpay script
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          showNotification('Failed to connect to payment gateway. Please check your network connection.', 'error');
          setPlacingOrder(false);
          return;
        }

        // 2. Initiate Razorpay Order on Backend
        const orderRes = await fetch(`${API_URL}/orders/razorpay-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('suk_token')}`
          },
          body: JSON.stringify({
            total: getTotal(),
            address_id: selectedAddress,
            discount: getDiscount(),
            subtotal: getSubtotal(),
            shipping_cost: getShippingCost()
          })
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json();
          throw new Error(errData.message || 'Failed to initialize payment gateway order');
        }

        const orderData = await orderRes.json();

        // If backend returned a mock fallback order
        if (orderData.is_mock) {
          setMockOrderData(orderData);
          setShowMockModal(true);
          setPlacingOrder(false);
          return;
        }

        // 3. Configure Razorpay checkout options
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Sukhira',
          description: 'Premium Skincare Checkout',
          order_id: orderData.razorpay_order_id,
          handler: async function (response) {
            try {
              setPlacingOrder(true);
              // 1. Send transaction payload to verify signature and place order
              const verifyRes = await fetch(`${API_URL}/orders/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('suk_token')}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  address_id: selectedAddress.id,
                  payment_method: 'RAZORPAY',
                  discount: getDiscountAmount(),
                  subtotal: getSubtotal(),
                  shipping_cost: getShippingCost(),
                  total: getTotal()
                })
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                clearCart();
                navigate(`/confirmation/${verifyData.order_id_str}`);
              } else {
                const verifyData = await verifyRes.json();
                showNotification(verifyData.message || 'Payment verification failed', 'error');
              }
            } catch (err) {
              console.error('Error during signature verification:', err);
              showNotification('An error occurred while verifying the payment.', 'error');
            } finally {
              setPlacingOrder(false);
            }
          },
          prefill: {
            name: selectedAddress.name || '',
            email: selectedAddress.email || '',
            contact: selectedAddress.phone || ''
          },
          notes: {
            address: selectedAddress.address_line
          },
          theme: {
            color: '#ea580c' // matching our premium orange brand color
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          showNotification(`Payment failed: ${resp.error.description}`, 'error');
          setPlacingOrder(false);
        });
        rzp.open();
      } catch (err) {
        console.error('Razorpay Checkout error:', err);
        showNotification(err.message || 'Checkout failed', 'error');
        setPlacingOrder(false);
      }
    } else {
      // Cash on Delivery (COD)
      try {
        // Places standard cash on delivery order
        const res = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('suk_token')}`
          },
          body: JSON.stringify({
            address_id: selectedAddress.id,
            payment_method: paymentMethod,
            discount: getDiscountAmount(),
            subtotal: getSubtotal(),
            shipping_cost: getShippingCost(),
            total: getTotal()
          })
        });

        if (res.ok) {
          const data = await res.json();
          clearCart();
          navigate(`/confirmation/${data.order_id_str}`);
        } else {
          const data = await res.json();
          showNotification(data.message || 'Failed to place order', 'error');
        }
      } catch (err) {
        console.error('Error placing order:', err);
      } finally {
        setPlacingOrder(false);
      }
    }
  };

  if (cartItems.length === 0 && step < 3) {
    return (
      <div className="checkout-page" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2>Your Checkout Session Expired</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem 0' }}>Your cart is empty.</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ display: 'inline-block', width: 'auto' }}>
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Secure Checkout</h1>

      {/* Stepper Indicator */}
      <div className="checkout-steps-bar">
        <div className={`checkout-step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-indicator-circle">{step > 1 ? <Check size={16} /> : '1'}</div>
          <span>Shipping</span>
        </div>
        <div className={`step-indicator-line ${step > 1 ? 'active' : ''}`} />
        <div className={`checkout-step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-indicator-circle">{step > 2 ? <Check size={16} /> : '2'}</div>
          <span>Summary</span>
        </div>
        <div className={`step-indicator-line ${step > 2 ? 'active' : ''}`} />
        <div className={`checkout-step-indicator ${step === 3 ? 'active' : ''}`}>
          <div className="step-indicator-circle">3</div>
          <span>Payment</span>
        </div>
      </div>

      <div className="checkout-content-grid">
        {/* Left Side: Steps Content */}
        <div className="checkout-step-panel">
          {/* STEP 1: ADDRESS */}
          {step === 1 && (
            <div>
              <h3 className="checkout-step-title">Select Shipping Address</h3>
              
              {!showNewAddressForm && addresses.length > 0 && (
                <div className="address-cards-list">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`address-card ${selectedAddressId === addr.id || (!selectedAddressId && addr.is_default) ? 'selected' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                        <MapPin size={18} style={{ color: 'var(--accent-color)' }} />
                        <span>{addr.name}</span>
                        {addr.is_default === 1 && <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: 'var(--bg-card)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Default</span>}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '1.6rem' }}>
                        {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '1.6rem', marginTop: '0.2rem' }}>
                        Phone: {addr.phone} | Email: {addr.email}
                      </p>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="btn-secondary"
                    style={{ marginTop: '1rem', width: 'fit-content' }}
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {showNewAddressForm && (
                <form onSubmit={handleCreateAddress} className="add-review-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '1.2rem' }}>Add a New Shipping Address</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Contact Name</label>
                      <input type="text" placeholder="e.g. Rahul Sharma" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" placeholder="10-digit number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="e.g. rahul@gmail.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Address Details (House No, Building, Street)</label>
                    <input type="text" placeholder="Apartment, Street name, Area" value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>City</label>
                      <input type="text" placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input type="text" placeholder="State" value={newState} onChange={(e) => setNewState(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Pincode</label>
                      <input type="text" placeholder="6-digit ZIP" value={newPincode} onChange={(e) => setNewPincode(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                      Save and Use Address
                    </button>
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setShowNewAddressForm(false)} className="btn-secondary" style={{ width: 'auto' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {!showNewAddressForm && addresses.length > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                  style={{ marginTop: '2rem', width: '100%' }}
                >
                  Deliver to This Address →
                </button>
              )}
            </div>
          )}

          {/* STEP 2: SUMMARY */}
          {step === 2 && (
            <div>
              <h3 className="checkout-step-title">Review Your Order</h3>
              
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={18} style={{ color: 'var(--accent-color)' }} />
                  Shipping Destination
                </h4>
                {selectedAddress && (
                  <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--border-radius)', fontSize: '0.95rem' }}>
                    <strong>{selectedAddress.name}</strong> • Phone: {selectedAddress.phone}
                    <p style={{ marginTop: '0.3rem', color: 'var(--text-muted)' }}>
                      {selectedAddress.address_line}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </p>
                  </div>
                )}
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Change Address
                </button>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Review Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cartItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                      <img src={item.images[0]} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div style={{ flexGrow: 1 }}>
                        <h5 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</h5>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Qty: {item.quantity} {item.variant && `| Option: ${item.variant}`}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ width: '40%' }}>
                  ← Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ width: '60%' }}>
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <div>
              <h3 className="checkout-step-title">Select Payment Method</h3>
              
              <div className="payment-options-list">
                {/* COD */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`payment-option-row ${paymentMethod === 'COD' ? 'selected' : ''}`}
                >
                  <input type="radio" checked={paymentMethod === 'COD'} readOnly style={{ marginTop: '3px' }} />
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.05rem' }}>
                      <Truck size={18} />
                      Cash on Delivery (COD)
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Pay in cash or digital wallet on delivery of your order.
                    </p>
                  </div>
                </div>

                {/* ONLINE (RAZORPAY) */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`payment-option-row ${paymentMethod === 'ONLINE' ? 'selected' : ''}`}
                >
                  <input type="radio" checked={paymentMethod === 'ONLINE'} readOnly style={{ marginTop: '3px' }} />
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.05rem' }}>
                      <ShieldCheck size={18} />
                      Online Payment (Card, UPI, Netbanking - Razorpay)
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Pay securely using Razorpay's test gateway sandbox.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ width: '40%' }}>
                  ← Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="btn-primary"
                  style={{ width: '60%' }}
                >
                  {placingOrder ? 'Processing...' : `Place Order (₹${getTotal()})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Total Summary Panel */}
        <div>
          <div className="cart-summary-card">
            <h4 style={{ fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              Payment Details
            </h4>
            <div className="summary-row">
              <span>Items Total</span>
              <span>₹{getSubtotal()}</span>
            </div>
            {getDiscountAmount() > 0 && (
              <div className="summary-row" style={{ color: 'var(--accent-color)' }}>
                <span>Coupon Applied</span>
                <span>-₹{getDiscountAmount()}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping cost</span>
              <span>{getShippingCost() === 0 ? 'FREE' : `₹${getShippingCost()}`}</span>
            </div>
            <div className="summary-row total">
              <span>Payable Amount</span>
              <span>₹{getTotal()}</span>
            </div>
            
            <div style={{ display: 'flex', itemsAlign: 'center', gap: '0.5rem', background: 'var(--accent-light)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '1.5rem', color: 'var(--accent-color)', fontSize: '0.8rem' }}>
              <ShieldCheck size={18} />
              <span>Checkout is completely safe and encrypted under SSL.</span>
            </div>
          </div>
        </div>
      </div>

      {showMockModal && mockOrderData && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '450px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '1rem' }}>
              Razorpay Test Sandbox (Mock Simulation)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Because your Razorpay credentials are unset or mock keys, the system is running in **Mock Simulation Mode**. 
              You can simulate a successful or failed payment to verify the order placement database logic.
            </p>
            
            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>Mock Order ID: <strong>{mockOrderData.razorpay_order_id}</strong></div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Payable Total: <span style={{ color: 'var(--accent-color)' }}>₹{getTotal()}</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button 
                onClick={handleVerifyMockPayment}
                className="btn-primary" 
                style={{ width: '100%' }}
              >
                Simulate Successful Payment
              </button>
              <button 
                onClick={() => { setShowMockModal(false); showNotification('Simulated payment failure.', 'error'); }}
                className="btn-danger" 
                style={{ width: '100%' }}
              >
                Simulate Failed Payment
              </button>
              <button 
                onClick={() => setShowMockModal(false)}
                className="btn-secondary" 
                style={{ width: '100%' }}
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
