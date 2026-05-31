import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const fetchCart = useCallback(async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCart(token);
    } else {
      const guestCart = JSON.parse(localStorage.getItem('suk_guest_cart') || '[]');
      setCartItems(guestCart);
    }
  }, [token, fetchCart]);

  const addToCart = useCallback(async (product, quantity = 1, variant = null) => {
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
          await fetchCart(token);
        } else {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to add to cart');
        }
      } catch (err) {
        console.error('Error adding to database cart:', err);
      }
    } else {
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
  }, [token, cartItems, fetchCart]);

  const updateQuantity = useCallback(async (cartItemId, newQty) => {
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
          await fetchCart(token);
        }
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    } else {
      const guestCart = cartItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQty } : item
      );
      setCartItems(guestCart);
      localStorage.setItem('suk_guest_cart', JSON.stringify(guestCart));
    }
  }, [token, cartItems, fetchCart]);

  const removeFromCart = useCallback(async (cartItemId) => {
    if (token && !String(cartItemId).startsWith('guest-')) {
      try {
        const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          await fetchCart(token);
        }
      } catch (err) {
        console.error('Error removing from cart:', err);
      }
    } else {
      const guestCart = cartItems.filter((item) => item.id !== cartItemId);
      setCartItems(guestCart);
      localStorage.setItem('suk_guest_cart', JSON.stringify(guestCart));
    }
  }, [token, cartItems, fetchCart]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    setCouponCode('');
    setDiscountPercent(0);
    localStorage.removeItem('suk_guest_cart');
  }, []);

  const applyCoupon = useCallback((code) => {
    const uppercaseCode = code.toUpperCase().trim();
    if (uppercaseCode === 'WINTER30' || uppercaseCode === 'SUMMER30' || uppercaseCode === 'MONSOON30') {
      setCouponCode(uppercaseCode);
      setDiscountPercent(30);
      return { success: true, message: '30% Seasonal Discount Applied!' };
    } else if (uppercaseCode === 'WELCOME10' || uppercaseCode === 'ROUTINE10') {
      setCouponCode(uppercaseCode);
      setDiscountPercent(10);
      return { success: true, message: '10% Routine/Welcome Discount Applied!' };
    }
    return { success: false, message: 'Invalid coupon code.' };
  }, []);

  const removeCoupon = useCallback(() => {
    setCouponCode('');
    setDiscountPercent(0);
  }, []);

  const getSubtotal = useCallback(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const getBundleDiscount = useCallback(() => {
    let bundleDiscountTotal = 0;
    
    // Check Winter Bundle
    const hasWinterMoisturizer = cartItems.some(i => i.name?.includes('Barrier Repair Winter Cream'));
    const hasWinterLipBalm = cartItems.some(i => i.name?.includes('Shea Butter Deep Nourishing Lip Balm'));
    const hasWinterHandCream = cartItems.some(i => i.name?.includes('Hand & Nail Cream') || i.name?.includes('Rosehip Face Oil'));
    if (hasWinterMoisturizer && hasWinterLipBalm && hasWinterHandCream) {
      const winterItems = cartItems.filter(i => 
        i.name?.includes('Barrier Repair Winter Cream') || 
        i.name?.includes('Shea Butter Deep Nourishing Lip Balm') || 
        i.name?.includes('Hand & Nail Cream') || 
        i.name?.includes('Rosehip Face Oil')
      );
      const winterSubtotal = winterItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      bundleDiscountTotal += Math.round(winterSubtotal * 0.15);
    }

    // Check Summer Bundle
    const hasSummerSunscreen = cartItems.some(i => i.name?.includes('Matte Gel Sunscreen SPF 50'));
    const hasSummerAfterSun = cartItems.some(i => i.name?.includes('Aloe Vera Soothing After-Sun Gel'));
    const hasSummerMist = cartItems.some(i => i.name?.includes('Cucumber & Rose Hydrating Face Mist'));
    if (hasSummerSunscreen && hasSummerAfterSun && hasSummerMist) {
      const summerItems = cartItems.filter(i => 
        i.name?.includes('Matte Gel Sunscreen SPF 50') || 
        i.name?.includes('Aloe Vera Soothing After-Sun Gel') || 
        i.name?.includes('Cucumber & Rose Hydrating Face Mist')
      );
      const summerSubtotal = summerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      bundleDiscountTotal += Math.round(summerSubtotal * 0.15);
    }

    // Check Monsoon Bundle
    const hasMonsoonFootCream = cartItems.some(i => i.name?.includes('Anti-Fungal Protective Foot Cream'));
    const hasMonsoonFaceWash = cartItems.some(i => i.name?.includes('Tea Tree Oil-Control Foaming Face Wash'));
    const hasMonsoonClayMask = cartItems.some(i => i.name?.includes('Purifying Charcoal Clay Face Mask'));
    if (hasMonsoonFootCream && hasMonsoonFaceWash && hasMonsoonClayMask) {
      const monsoonItems = cartItems.filter(i => 
        i.name?.includes('Anti-Fungal Protective Foot Cream') || 
        i.name?.includes('Tea Tree Oil-Control Foaming Face Wash') || 
        i.name?.includes('Purifying Charcoal Clay Face Mask')
      );
      const monsoonSubtotal = monsoonItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      bundleDiscountTotal += Math.round(monsoonSubtotal * 0.15);
    }

    return bundleDiscountTotal;
  }, [cartItems]);

  const getDiscountAmount = useCallback(() => {
    const couponDiscount = Math.round((getSubtotal() * discountPercent) / 100);
    const bundleDiscount = getBundleDiscount();
    return couponDiscount + bundleDiscount;
  }, [getSubtotal, getBundleDiscount, discountPercent]);

  const getShippingCost = useCallback(() => {
    const sub = getSubtotal() - getDiscountAmount();
    if (sub === 0) return 0;
    return sub > 999 ? 0 : 99;
  }, [getSubtotal, getDiscountAmount]);

  const getTotal = useCallback(() => {
    const sub = getSubtotal();
    const disc = getDiscountAmount();
    const ship = getShippingCost();
    return sub - disc + ship;
  }, [getSubtotal, getDiscountAmount, getShippingCost]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const syncGuestCart = useCallback(async (userToken) => {
    try {
      const guestCart = JSON.parse(localStorage.getItem('suk_guest_cart') || '[]');
      if (guestCart.length > 0) {
        for (const item of guestCart) {
          try {
            await fetch(`${API_URL}/cart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`
              },
              body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity, variant: item.variant })
            });
          } catch (itemErr) {
            console.error(`Failed to sync guest cart item ${item.product_id}:`, itemErr);
          }
        }
        localStorage.removeItem('suk_guest_cart');
      }
    } catch (err) {
      console.error('Error parsing guest cart during sync:', err);
    } finally {
      await fetchCart(userToken);
    }
  }, [fetchCart]);

  const contextValue = useMemo(() => ({
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
    getBundleDiscount,
    getDiscountAmount,
    getShippingCost,
    getTotal,
    getCartCount,
    syncGuestCart
  }), [
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
    getBundleDiscount,
    getDiscountAmount,
    getShippingCost,
    getTotal,
    getCartCount,
    syncGuestCart
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
