import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Send, Snowflake, Sun, CloudRain } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>SUKHIRA</h3>
          <p>Curating premium clothing, active accessories, and dermatologist-tested skincare routines tailored specifically for the physiological changes of your body in every season.</p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon">
              <Facebook size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon">
              <Instagram size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon">
              <Twitter size={18} />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Shop Seasons</h4>
          <ul className="footer-links">
            <li>
              <Link to="/collection/winter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Snowflake size={14} />
                <span>Winter Collection</span>
              </Link>
            </li>
            <li>
              <Link to="/collection/summer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sun size={14} />
                <span>Summer Collection</span>
              </Link>
            </li>
            <li>
              <Link to="/collection/monsoon" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CloudRain size={14} />
                <span>Monsoon Collection</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/shipping-policy">Shipping Policy</Link></li>
            <li><Link to="/return-policy">Return & Refund Policy</Link></li>
            <li><Link to="/faq">FAQs</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Stay Curated</h4>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Subscribe to get seasonal style guides, skincare tips, and early access to collection drops.</p>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <div className="newsletter-input-wrapper">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-btn">
                <Send size={16} />
              </button>
            </div>
            {subscribed && <span style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Subscribed successfully!</span>}
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Sukhira E-Commerce. All rights reserved.</p>
        <p style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/shipping-policy">Privacy Policy</Link>
          <span>•</span>
          <Link to="/return-policy">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
