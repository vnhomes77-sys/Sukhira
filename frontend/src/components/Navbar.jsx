import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Snowflake, Sun, CloudRain, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeSeason, setActiveSeason }) => {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection/${activeSeason}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
        <button
          onClick={() => setActiveSeason('winter')}
          className={`nav-season-tab ${activeSeason === 'winter' ? 'active' : ''}`}
        >
          <Snowflake size={16} />
          <span>Winter</span>
        </button>
        <button
          onClick={() => setActiveSeason('summer')}
          className={`nav-season-tab ${activeSeason === 'summer' ? 'active' : ''}`}
        >
          <Sun size={16} />
          <span>Summer</span>
        </button>
        <button
          onClick={() => setActiveSeason('monsoon')}
          className={`nav-season-tab ${activeSeason === 'monsoon' ? 'active' : ''}`}
        >
          <CloudRain size={16} />
          <span>Monsoon</span>
        </button>
      </div>

      <div className="nav-actions">
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder={`Search ${activeSeason} products...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

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
