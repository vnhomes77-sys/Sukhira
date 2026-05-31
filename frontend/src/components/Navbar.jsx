import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Snowflake, Sun, CloudRain, Heart, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Navbar = ({ activeSeason, setActiveSeason }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartCount } = useCart();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const searchContainerRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Autocomplete Suggestions Debounce Fetching
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/products?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close search suggestions & mobile elements
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target) && !e.target.closest('.mobile-search-trigger')) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      navigate(`/collection/${activeSeason}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (productId) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    navigate(`/product/${productId}`);
  };

  const handleSeasonTabClick = (season) => {
    setActiveSeason(season);
    navigate(`/season/${season}`);
  };

  const getSeasonBrandIcon = (season) => {
    const iconStyle = { display: 'inline-block', verticalAlign: 'middle' };
    if (season === 'winter') return <Snowflake size={22} style={iconStyle} />;
    if (season === 'summer') return <Sun size={22} style={iconStyle} />;
    return <CloudRain size={22} style={iconStyle} />;
  };

  return (
    <>
      <nav className="navbar">
        {/* Mobile Hamburger menu */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)}>
          <Menu size={24} />
        </button>

        <Link to="/" className="nav-brand">
          <span className="nav-brand-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {getSeasonBrandIcon(activeSeason)}
          </span>
          <span>SUKHIRA</span>
        </Link>

        <div className="nav-seasons-tabs">
          <div className={`nav-season-slider active-${activeSeason}`} />
          <button
            onClick={() => handleSeasonTabClick('winter')}
            className={`nav-season-tab ${activeSeason === 'winter' ? 'active' : ''}`}
          >
            <Snowflake size={16} />
            <span>Winter</span>
          </button>
          <button
            onClick={() => handleSeasonTabClick('summer')}
            className={`nav-season-tab ${activeSeason === 'summer' ? 'active' : ''}`}
          >
            <Sun size={16} />
            <span>Summer</span>
          </button>
          <button
            onClick={() => handleSeasonTabClick('monsoon')}
            className={`nav-season-tab ${activeSeason === 'monsoon' ? 'active' : ''}`}
          >
            <CloudRain size={16} />
            <span>Monsoon</span>
          </button>
        </div>

        <div className="nav-actions">
          {/* Smart Search Bar Container */}
          <div ref={searchContainerRef} style={{ position: 'relative' }}>
            <form onSubmit={handleSearchSubmit} className="search-bar">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder={`Search ${activeSeason} products...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions-dropdown">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.id)}
                    className="suggestion-item"
                  >
                    <img src={item.images[0]} alt={item.name} className="suggestion-thumb" />
                    <div className="suggestion-info">
                      <div className="suggestion-name">{item.name}</div>
                      <div className="suggestion-meta">
                        <span className="suggestion-tag">{item.season}</span>
                        <span className="suggestion-price">₹{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user && (
            <Link to="/account?tab=wishlist" className="nav-icon-btn nav-wishlist-icon" title="Wishlist">
              <Heart size={20} />
            </Link>
          )}

          <Link to="/cart" className="nav-icon-btn" title="Shopping Cart">
            <ShoppingCart size={20} />
            {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
          </Link>

          <Link to={user ? "/account" : "/login"} className="nav-icon-btn nav-user-icon" title="My Account">
            <User size={20} />
          </Link>
        </div>

        {/* Mobile Actions: Search Trigger & Cart */}
        <div className="mobile-actions">
          <button className="nav-icon-btn mobile-search-trigger" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
            <Search size={22} />
          </button>
          
          <Link to="/cart" className="nav-icon-btn" title="Shopping Cart">
            <ShoppingCart size={22} />
            {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
          </Link>
        </div>
      </nav>

      {/* Mobile Search Dropdown overlay */}
      {mobileSearchOpen && (
        <div className="mobile-search-bar-row" ref={mobileSearchRef}>
          <form onSubmit={handleSearchSubmit} className="search-bar mobile-search-form">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder={`Search ${activeSeason} products...`}
              value={searchQuery}
              autoFocus
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <button type="button" className="close-search-btn" onClick={() => setMobileSearchOpen(false)}>
              <X size={18} />
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions-dropdown mobile-search-dropdown">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.id)}
                  className="suggestion-item"
                >
                  <img src={item.images[0]} alt={item.name} className="suggestion-thumb" />
                  <div className="suggestion-info">
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-meta">
                      <span className="suggestion-tag">{item.season}</span>
                      <span className="suggestion-price">₹{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sliding Mobile Drawer Menu */}
      <div className={`mobile-drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="nav-brand">
            <span className="nav-brand-logo">{getSeasonBrandIcon(activeSeason)}</span>
            <span>SUKHIRA</span>
          </div>
          <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="mobile-drawer-body">
          <div className="mobile-drawer-section">
            <h4>Shop by Season</h4>
            <div className="mobile-drawer-seasons-list">
              <button
                onClick={() => { handleSeasonTabClick('winter'); setMenuOpen(false); }}
                className={`mobile-drawer-season-btn ${activeSeason === 'winter' ? 'active' : ''}`}
              >
                <Snowflake size={16} />
                <span>Winter Collection</span>
              </button>
              <button
                onClick={() => { handleSeasonTabClick('summer'); setMenuOpen(false); }}
                className={`mobile-drawer-season-btn ${activeSeason === 'summer' ? 'active' : ''}`}
              >
                <Sun size={16} />
                <span>Summer Collection</span>
              </button>
              <button
                onClick={() => { handleSeasonTabClick('monsoon'); setMenuOpen(false); }}
                className={`mobile-drawer-season-btn ${activeSeason === 'monsoon' ? 'active' : ''}`}
              >
                <CloudRain size={16} />
                <span>Monsoon Collection</span>
              </button>
            </div>
          </div>

          <div className="mobile-drawer-section">
            <h4>Quick Links</h4>
            <ul className="mobile-drawer-links">
              <li>
                <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              </li>
              <li>
                <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({getCartCount()})</Link>
              </li>
              {user && (
                <li>
                  <Link to="/account?tab=wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
                </li>
              )}
              <li>
                <Link to={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)}>
                  {user ? "My Account" : "Login / Register"}
                </Link>
              </li>
              <li>
                <Link to="/order-tracking" onClick={() => setMenuOpen(false)}>Track Order</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
