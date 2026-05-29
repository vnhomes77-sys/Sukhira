import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      // Local storage guest cart
      const guestCart = JSON.parse(localStorage.getItem('suk_guest_cart') || '[]');
      setCartItems(guestCart);
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const addToCart = async (product, quantity = 1, variant = null) => {
    if (token) {
      try {
        const res = await fetch(`${API_URL}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.id, quantity, variant })
        });
        if (res.ok) {
          await fetchCart();
        } else {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to add to cart');
        }
      } catch (err) {
        console.error('Error adding to database cart:', err);
      }
    } else {
      // Guest cart logic
      const guestCart = [...cartItems];
      const matchIndex = guestCart.findIndex(
        (item) => item.product_id === product.id && item.variant === variant
      );

      if (matchIndex > -1) {
        guestCart[matchIndex].quantity += quantity;
      } else {
        guestCart.push({
          id: `guest-${Date.now()}-${Math.random()}`,
          product_id: product.id,
          quantity,
          variant,
          name: product.name,
          price: product.price,
          images: product.images,
          season: product.season,
          category: product.category
        });
      }
      setCartItems(guestCart);
      localStorage.setItem('suk_guest_cart', JSON.stringify(guestCart));
    }
  };

  const updateQuantity = async (cartItemId, newQty) => {
    if (newQty <= 0) return;
    if (token && !String(cartItemId).startsWith('guest-')) {
      try {
        const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ quantity: newQty })
        });
        if (res.ok) {
          await fetchCart();
        }
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    } else {
      // Guest cart
      const guestCart = cartItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQty } : item
      );
      setCartItems(guestCart);
      localStorage.setItem('suk_guest_cart', JSON.stringify(guestCart));
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (token && !String(cartItemId).startsWith('guest-')) {
      try {
        const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          await fetchCart();
        }
      } catch (err) {
        console.error('Error removing from cart:', err);
      }
    } else {
      // Guest cart
      const guestCart = cartItems.filter((item) => item.id !== cartItemId);
      setCartItems(guestCart);
      localStorage.setItem('suk_guest_cart', JSON.stringify(guestCart));
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    setCouponCode('');
    setDiscountPercent(0);
    localStorage.removeItem('suk_guest_cart');
    if (token) {
      // Clear database cart items by deleting them (can be done sequentially or via a bulk route,
      // here we just clear the local state; backend handles clearing cart items automatically during order placement)
    }
  };

  const applyCoupon = (code) => {
    const uppercaseCode = code.toUpperCase().trim();
    if (uppercaseCode === 'WINTER30' || uppercaseCode === 'SUMMER30' || uppercaseCode === 'MONSOON30') {
      setCouponCode(uppercaseCode);
      setDiscountPercent(30);
      return { success: true, message: '30% Seasonal Discount Applied!' };
    } else if (uppercaseCode === 'WELCOME10') {
      setCouponCode(uppercaseCode);
      setDiscountPercent(10);
      return { success: true, message: '10% Welcome Discount Applied!' };
    }
    return { success: false, message: 'Invalid coupon code.' };
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
  };

  // Calculations
  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getDiscountAmount = () => {
    return Math.round((getSubtotal() * discountPercent) / 100);
  };

  const getShippingCost = () => {
    const sub = getSubtotal() - getDiscountAmount();
    if (sub === 0) return 0;
    return sub > 999 ? 0 : 99; // Free shipping over INR 999
  };

  const getTotal = () => {
    const sub = getSubtotal();
    const disc = getDiscountAmount();
    const ship = getShippingCost();
    return sub - disc + ship;
  };

  const getCartCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        couponCode,
        discountPercent,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        getSubtotal,
        getDiscountAmount,
        getShippingCost,
        getTotal,
        getCartCount,
        syncGuestCart: async (userToken) => {
          // Sync guest cart to user database cart upon login
          const guestCart = JSON.parse(localStorage.getItem('suk_guest_cart') || '[]');
          if (guestCart.length > 0) {
            for (const item of guestCart) {
              await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${userToken}`
                },
                body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity, variant: item.variant })
              });
            }
            localStorage.removeItem('suk_guest_cart');
          }
          await fetchCart();
        }
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
