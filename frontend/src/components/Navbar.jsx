import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Snowflake, Sun, CloudRain, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeSeason, setActiveSeason }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartCount } = useCart();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Autocomplete Suggestions Debounce Fetching
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Fetch products matching the query from the active season (or overall, let's search overall which is smarter)
        const res = await fetch(`http://localhost:5000/api/products?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to show suggestions
          setSuggestions(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close search suggestions
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/collection/${activeSeason}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (productId) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/product/${productId}`);
  };

  const handleSeasonTabClick = (season) => {
    setActiveSeason(season);
    navigate(`/collection/${season}`);
  };

  const getSeasonEmoji = (season) => {
    if (season === 'winter') return '❄️';
    if (season === 'summer') return '☀️';
    return '🌧️';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span className="nav-brand-logo">{getSeasonEmoji(activeSeason)}</span>
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
          <Link to="/account?tab=wishlist" className="nav-icon-btn" title="Wishlist">
            <Heart size={20} />
          </Link>
        )}

        <Link to="/cart" className="nav-icon-btn" title="Shopping Cart">
          <ShoppingCart size={20} />
          {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
        </Link>

        <Link to={user ? "/account" : "/login"} className="nav-icon-btn" title="My Account">
          <User size={20} />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
