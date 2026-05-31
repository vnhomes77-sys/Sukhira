import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Snowflake, Sun, CloudRain } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SkincareQuiz from '../components/SkincareQuiz';
import { API_URL } from '../config';

const Home = ({ activeSeason, setActiveSeason }) => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState({ winter: [], summer: [], monsoon: [] });
  const [spotlightProducts, setSpotlightProducts] = useState({ winter: [], summer: [], monsoon: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Intersection Observer for scroll theme sync
  useEffect(() => {
    if (!setActiveSeason) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is in active view
      threshold: 0
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const season = entry.target.getAttribute('data-season');
          if (season) {
            setActiveSeason(season);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const elements = document.querySelectorAll('.season-block[data-season]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [setActiveSeason]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        
        // Filter featured
        const featured = {
          winter: data.filter((p) => p.season === 'winter' && p.is_featured).slice(0, 4),
          summer: data.filter((p) => p.season === 'summer' && p.is_featured).slice(0, 4),
          monsoon: data.filter((p) => p.season === 'monsoon' && p.is_featured).slice(0, 4)
        };

        // Filter spotlights
        const spotlight = {
          winter: data.filter((p) => p.season === 'winter' && p.is_spotlight).slice(0, 3),
          summer: data.filter((p) => p.season === 'summer' && p.is_spotlight).slice(0, 3),
          monsoon: data.filter((p) => p.season === 'monsoon' && p.is_spotlight).slice(0, 3)
        };

        setFeaturedProducts(featured);
        setSpotlightProducts(spotlight);
      }
    } catch (err) {
      console.error('Error fetching homepage products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHeroData = () => {
    if (activeSeason === 'winter') {
      return {
        tagline: 'Defeat the Winter Chill',
        title: 'Snuggle Up in Comfort & Soft Skin',
        desc: 'Wrap yourself in premium Merino knits and repair winter dryness with our clinical ceramide skincare series.',
        ctaText: 'Enter Winter Hub',
        image: '/winter_home_banner.png'
      };
    } else if (activeSeason === 'summer') {
      return {
        tagline: 'Embrace the Summer Sun',
        title: 'Stay Fresh, Cool & Protected',
        desc: 'Lightweight linen apparel and non-greasy matte sunscreen gels designed to help you thrive under the sun.',
        ctaText: 'Enter Summer Hub',
        image: '/summer_home_banner.png'
      };
    } else {
      return {
        tagline: 'Weather the Heavy Monsoon',
        title: 'Shield Yourself from Rain & Humidity',
        desc: 'Waterproof shells, anti-slip outdoor sandals, and anti-fungal neem foot protection for trouble-free commutes.',
        ctaText: 'Enter Monsoon Hub',
        image: '/monsoon_home_banner.png'
      };
    }
  };

  const hero = getHeroData();

  return (
    <div className="homepage">
      {/* Hero Banner */}
      <div
        className="hero-banner"
        style={{ backgroundImage: `url(${hero.image})` }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-tagline">{hero.tagline}</span>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-desc">{hero.desc}</p>
          <button onClick={() => navigate(`/season/${activeSeason}`)} className="cta-btn">
            <span>{hero.ctaText}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Season Showcase Sections */}
      <div className="season-section-container">
        {/* Winter Block */}
        <div className="season-block" data-season="winter" style={{ borderLeft: '6px solid #3182ce' }}>
          <div className="season-block-header">
            <div className="season-mood">
              <Snowflake size={36} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <div>
                <span className="season-subtitle">Cozy & Protected</span>
                <Link to="/season/winter" style={{ display: 'inline-block' }}>
                  <h2 className="season-title" style={{ transition: 'color 0.3s' }}>
                    The Winter Collection
                  </h2>
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <Link to="/season/winter" className="btn-secondary">
                <span>Enter Hub</span>
                <ChevronRight size={16} />
              </Link>
              <Link to="/collection/winter" className="btn-primary" style={{ flexGrow: 0, padding: '0.6rem 1.4rem', fontSize: '0.95rem' }}>
                <span>Shop All</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</div>
          ) : (
            <div className="product-grid">
              {featuredProducts.winter.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>

        {/* Summer Block */}
        <div className="season-block" data-season="summer" style={{ borderLeft: '6px solid #dd6b20' }}>
          <div className="season-block-header">
            <div className="season-mood">
              <Sun size={36} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <div>
                <span className="season-subtitle">Bright & Airy</span>
                <Link to="/season/summer" style={{ display: 'inline-block' }}>
                  <h2 className="season-title" style={{ transition: 'color 0.3s' }}>
                    The Summer Collection
                  </h2>
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <Link to="/season/summer" className="btn-secondary">
                <span>Enter Hub</span>
                <ChevronRight size={16} />
              </Link>
              <Link to="/collection/summer" className="btn-primary" style={{ flexGrow: 0, padding: '0.6rem 1.4rem', fontSize: '0.95rem' }}>
                <span>Shop All</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</div>
          ) : (
            <div className="product-grid">
              {featuredProducts.summer.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>

        {/* Monsoon Block */}
        <div className="season-block" data-season="monsoon" style={{ borderLeft: '6px solid #059669' }}>
          <div className="season-block-header">
            <div className="season-mood">
              <CloudRain size={36} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <div>
                <span className="season-subtitle">Dry & Fresh</span>
                <Link to="/season/monsoon" style={{ display: 'inline-block' }}>
                  <h2 className="season-title" style={{ transition: 'color 0.3s' }}>
                    The Monsoon Collection
                  </h2>
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <Link to="/season/monsoon" className="btn-secondary">
                <span>Enter Hub</span>
                <ChevronRight size={16} />
              </Link>
              <Link to="/collection/monsoon" className="btn-primary" style={{ flexGrow: 0, padding: '0.6rem 1.4rem', fontSize: '0.95rem' }}>
                <span>Shop All</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</div>
          ) : (
            <div className="product-grid">
              {featuredProducts.monsoon.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skincare Advisor Quiz Section */}
      <SkincareQuiz season={activeSeason} />

      {/* Skincare Spotlight Row per Season */}
      <section className="skincare-spotlight">
        <div className="spotlight-title-block">
          <h2>
            <Sparkles size={24} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--accent-color)' }} />
            Skincare Spotlight
          </h2>
          <p>Dermatologist formulated skincare solutions built specifically for the environmental challenges of each season.</p>
        </div>

        {/* Winter Spotlight */}
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Snowflake size={20} style={{ color: 'var(--accent-color)' }} /> Winter Restoration (Anti-Dryness)
          </h3>
          <div className="spotlight-row">
            {spotlightProducts.winter.map((prod) => (
              <div key={prod.id} className="spotlight-card">
                <img src={prod.images[0]} alt={prod.name} className="spotlight-card-img" />
                <div className="spotlight-card-content">
                  <div>
                    <span className="spotlight-card-tag">{prod.category}</span>
                    <h4 className="spotlight-card-name">{prod.name}</h4>
                    <p className="spotlight-card-desc">{prod.description}</p>
                  </div>
                  <div className="spotlight-card-footer">
                    <span style={{ fontWeight: 700 }}>₹{prod.price}</span>
                    <Link to={`/product/${prod.id}`} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summer Spotlight */}
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sun size={20} style={{ color: 'var(--accent-color)' }} /> Summer Protection (SPF & Coolers)
          </h3>
          <div className="spotlight-row">
            {spotlightProducts.summer.map((prod) => (
              <div key={prod.id} className="spotlight-card">
                <img src={prod.images[0]} alt={prod.name} className="spotlight-card-img" />
                <div className="spotlight-card-content">
                  <div>
                    <span className="spotlight-card-tag">{prod.category}</span>
                    <h4 className="spotlight-card-name">{prod.name}</h4>
                    <p className="spotlight-card-desc">{prod.description}</p>
                  </div>
                  <div className="spotlight-card-footer">
                    <span style={{ fontWeight: 700 }}>₹{prod.price}</span>
                    <Link to={`/product/${prod.id}`} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monsoon Spotlight */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CloudRain size={20} style={{ color: 'var(--accent-color)' }} /> Monsoon Clarifying (Anti-Humidity)
          </h3>
          <div className="spotlight-row">
            {spotlightProducts.monsoon.map((prod) => (
              <div key={prod.id} className="spotlight-card">
                <img src={prod.images[0]} alt={prod.name} className="spotlight-card-img" />
                <div className="spotlight-card-content">
                  <div>
                    <span className="spotlight-card-tag">{prod.category}</span>
                    <h4 className="spotlight-card-name">{prod.name}</h4>
                    <p className="spotlight-card-desc">{prod.description}</p>
                  </div>
                  <div className="spotlight-card-footer">
                    <span style={{ fontWeight: 700 }}>₹{prod.price}</span>
                    <Link to={`/product/${prod.id}`} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
