import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Theme Particle Overlays
import SnowyEffect from './components/SnowyEffect';
import FloatingPetals from './components/FloatingPetals';
import FallingRaindrops from './components/FallingRaindrops';

// Pages
import Home from './pages/Home';
import SeasonCollection from './pages/SeasonCollection';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import Account from './pages/Account';
import Login from './pages/Login';
import Supporting from './pages/Supporting';
import SeasonHome from './pages/SeasonHome';

const ThemeSync = ({ setActiveSeason }) => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/collection/winter') || path.includes('/season/winter')) {
      setActiveSeason('winter');
    } else if (path.includes('/collection/summer') || path.includes('/season/summer')) {
      setActiveSeason('summer');
    } else if (path.includes('/collection/monsoon') || path.includes('/season/monsoon')) {
      setActiveSeason('monsoon');
    }
  }, [location.pathname, setActiveSeason]);
  return null;
};

function App() {
  // Global season state ('winter', 'summer', 'monsoon')
  // Starts with 'winter' by default or summer depending on choice, let's default to 'winter'
  const [activeSeason, setActiveSeason] = useState('winter');

  const renderSeasonOverlay = () => {
    if (activeSeason === 'winter') return <SnowyEffect />;
    if (activeSeason === 'summer') return <FloatingPetals />;
    if (activeSeason === 'monsoon') return <FallingRaindrops />;
    return null;
  };

  return (
    <BrowserRouter>
      <ThemeSync setActiveSeason={setActiveSeason} />
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <div className={`app-container theme-${activeSeason}`}>
                {/* Background Canvas Particle System */}
                {renderSeasonOverlay()}

                <Navbar activeSeason={activeSeason} setActiveSeason={setActiveSeason} />

                <div className="content-wrap">
                  <Routes>
                    <Route path="/" element={<Home activeSeason={activeSeason} setActiveSeason={setActiveSeason} />} />
                    <Route path="/season/:season" element={<SeasonHome setActiveSeason={setActiveSeason} />} />
                    <Route path="/collection/:season" element={<SeasonCollection />} />
                    <Route path="/product/:id" element={<ProductDetail setActiveSeason={setActiveSeason} />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/confirmation/:orderIdStr" element={<OrderConfirmation />} />
                    <Route path="/track/:orderIdStr" element={<OrderTracking />} />
                    <Route path="/track" element={<OrderTracking />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* Supporting Info Pages */}
                    <Route path="/about" element={<Supporting />} />
                    <Route path="/contact" element={<Supporting />} />
                    <Route path="/shipping-policy" element={<Supporting />} />
                    <Route path="/return-policy" element={<Supporting />} />
                    <Route path="/faq" element={<Supporting />} />

                    {/* Redirect any unmatched to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>

                <Footer />
              </div>
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
