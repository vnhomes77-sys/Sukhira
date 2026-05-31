import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, Sparkles, Snowflake, Sun, CloudRain } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SkincareQuiz from '../components/SkincareQuiz';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const SeasonHome = ({ setActiveSeason }) => {
  const { season } = useParams();
  const currentSeason = (season || 'winter').toLowerCase();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bundleAdded, setBundleAdded] = useState(false);

  useEffect(() => {
    // Sync root theme when mounting
    if (setActiveSeason) {
      setActiveSeason(currentSeason);
    }
    fetchSeasonalFeatured();
  }, [currentSeason]);

  const fetchSeasonalFeatured = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products?season=${currentSeason}`);
      if (res.ok) {
        const data = await res.json();
        setAllProducts(data);
        // Slice 4 featured/top rated items
        setFeaturedProducts(data.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching seasonal featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeasonalBundle = () => {
    if (currentSeason === 'winter') {
      return {
        name: 'Winter Oasis Deep Hydration Set',
        desc: 'Combat dry winter air with a complete ceramide barrier repair routine.',
        items: ['Ultra-Rich Barrier Repair Winter Cream', 'Shea Butter Deep Nourishing Lip Balm', 'Ceramide-Infused Hand & Nail Cream']
      };
    } else if (currentSeason === 'summer') {
      return {
        name: 'Summer Solstice SPF Sun Shield Set',
        desc: 'Block UV rays, soothe mild sunburns, and refresh hot skin instantly.',
        items: ['Broad Spectrum Matte Gel Sunscreen SPF 50', 'Pure Aloe Vera Soothing After-Sun Gel', 'Cucumber & Rose Hydrating Face Mist']
      };
    } else {
      return {
        name: 'Monsoon Clarifying Anti-Fungal Shield',
        desc: 'Keep humidity at bay, fight acne breakout oils, and protect feet from rainwater.',
        items: ['Anti-Fungal Protective Foot Cream', 'Tea Tree Oil-Control Foaming Face Wash', 'Purifying Charcoal Clay Face Mask']
      };
    }
  };

  const handleAddBundleToCart = (items) => {
    items.forEach(prod => {
      addToCart(prod, 1, null);
    });
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 3000);
  };


  const getSeasonDetails = () => {
    if (currentSeason === 'winter') {
      return {
        title: 'Winter Oasis',
        tagline: 'Defeat the Winter Chill',
        desc: 'Wrap yourself in snug premium Merino knits and secure your skin barrier against cold winds with rich lipids.',
        heroImg: '/winter_banner.png',
        catImages: {
          clothing: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=60',
          accessories: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=60',
          skincare: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=60'
        }
      };
    } else if (currentSeason === 'summer') {
      return {
        title: 'Summer Solstice',
        tagline: 'Embrace the Summer Sun',
        desc: 'Stay fresh in lightweight breathable linens and block harsh rays with our clinically approved matte sunscreen gels.',
        heroImg: '/summer_banner.png',
        catImages: {
          clothing: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=60',
          accessories: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&auto=format&fit=crop&q=60',
          skincare: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=60'
        }
      };
    } else {
      return {
        title: 'Monsoon Sanctuary',
        tagline: 'Weather the Heavy Monsoon',
        desc: 'Anti-slip sandals, roll-top waterproof backpacks, and tea tree clarifying skincare to beat stickiness and humidity.',
        heroImg: '/monsoon_banner.png',
        catImages: {
          clothing: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=60',
          accessories: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=60',
          skincare: 'https://images.unsplash.com/photo-1519735797-402a457224b7?w=800&auto=format&fit=crop&q=60'
        }
      };
    }
  };

  const details = getSeasonDetails();

  return (
    <div className="collection-page" style={{ padding: 0 }}>
      {/* Immersive Hero Header */}
      <div
        className="hero-banner"
        style={{ backgroundImage: `url(${details.heroImg})`, height: '440px' }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-tagline">{details.tagline}</span>
          <h1 className="hero-title">{details.title} Hub</h1>
          <p className="hero-desc">{details.desc}</p>
          <button onClick={() => navigate(`/collection/${currentSeason}`)} className="cta-btn">
            <span>Explore Entire Collection</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Visual Category Cards Grid */}
      <section style={{ padding: '5rem 5% 2rem 5%' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', textAlign: 'center', marginBottom: '3rem', fontWeight: 800 }}>
          Browse Category Collections
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Clothing Card */}
          <Link
            to={`/collection/${currentSeason}?category=clothing`}
            className="visual-category-card"
          >
            <div className="category-card-bg" style={{ backgroundImage: `url(${details.catImages.clothing})` }} />
            <div className="category-card-overlay" />
            <div className="category-card-content">
              <h3>Seasonal Apparel</h3>
              <p>Tailormade fabrics for this weather</p>
              <span className="category-card-link">Shop Clothing →</span>
            </div>
          </Link>

          {/* Accessories Card */}
          <Link
            to={`/collection/${currentSeason}?category=accessories`}
            className="visual-category-card"
          >
            <div className="category-card-bg" style={{ backgroundImage: `url(${details.catImages.accessories})` }} />
            <div className="category-card-overlay" />
            <div className="category-card-content">
              <h3>Active Accessories</h3>
              <p>Insulation, hydration & waterproof gear</p>
              <span className="category-card-link">Shop Accessories →</span>
            </div>
          </Link>

          {/* Skincare Card */}
          <Link
            to={`/collection/${currentSeason}?category=skincare`}
            className="visual-category-card"
          >
            <div className="category-card-bg" style={{ backgroundImage: `url(${details.catImages.skincare})` }} />
            <div className="category-card-overlay" />
            <div className="category-card-content">
              <h3>Barrier Skincare</h3>
              <p>Dermatologist-formulated defense lines</p>
              <span className="category-card-link">Shop Skincare →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Seasonal Featured Products Block */}
      <section style={{ padding: '4rem 5% 5rem 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Curated Highlights</span>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              Featured this {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
            </h2>
          </div>
          <Link to={`/collection/${currentSeason}`} className="btn-secondary">
            <span>Shop All {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading highlights...</div>
        ) : (
          <div className="product-grid">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Curated Seasonal Bundle Deals */}
      {(() => {
        const bundleDef = getSeasonalBundle();
        const bundleItems = allProducts.filter(p => bundleDef.items.includes(p.name));
        if (bundleItems.length === 0) return null;
        return (
          <section style={{ padding: '2rem 5% 4rem 5%', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--accent-light) 0%, rgba(255,255,255,0.4) 100%)', border: '2px solid var(--accent-color)', borderRadius: 'var(--border-radius)', padding: '2.5rem', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '1.2rem', right: '1.5rem', background: 'var(--accent-color)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Save 15% Instantly
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Curated Skincare Bundle</span>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {bundleDef.name}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0.5rem 0 2rem 0', maxWidth: '650px' }}>
                {bundleDef.desc} These items are designed to complement each other. Get them all to activate the automatic package savings at checkout.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {bundleItems.map((prod) => {
                  const images = Array.isArray(prod.images) ? prod.images : (typeof prod.images === 'string' ? JSON.parse(prod.images) : []);
                  return (
                    <div key={prod.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <img src={images[0]} alt={prod.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.8rem' }} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, minHeight: '2.2rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.name}</h4>
                      <span style={{ fontWeight: 800, color: 'var(--accent-color)', marginTop: '0.4rem', fontSize: '0.95rem' }}>₹{prod.price}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleAddBundleToCart(bundleItems)}
                  className="btn-primary" 
                  style={{ padding: '0.8rem 2.5rem', width: 'auto' }}
                >
                  {bundleAdded ? '✓ Bundle Added!' : 'Add Bundle to Cart'}
                </button>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Total: <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 500, marginRight: '0.4rem' }}>₹{bundleItems.reduce((acc, item) => acc + item.price, 0)}</span>
                  <span style={{ color: 'var(--accent-color)' }}>₹{Math.round(bundleItems.reduce((acc, item) => acc + item.price, 0) * 0.85)}</span>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Skincare Advisor Quiz Section */}
      <section style={{ padding: '0 5%' }}>
        <SkincareQuiz season={currentSeason} />
      </section>


      {/* Routine Guide Teaser Block */}
      <section style={{ background: 'var(--bg-spotlight)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '5rem 5%' }}>
        <div style={{ display: 'flex', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 450px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.6rem' }}>
              <Sparkles size={16} />
              Dermal Routine Spotlight
            </span>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.2rem', lineHeight: '1.2' }}>
              Formulated specifically for the seasonal shift
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
              Our bodies undergo dramatic physiological adjustments in response to humidity, solar radiation, and freezing cold. Learn how to buffer your skin barrier using our step-by-step guides.
            </p>
            <Link to={`/collection/${currentSeason}`} className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
              <span>Read Routine Guide</span>
              <ArrowRight size={18} />
            </Link>
          </div>
          
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentSeason === 'winter' && (
              <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Snowflake size={24} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <h4 style={{ fontWeight: 700 }}>Winter: Lipids & Barrier Repair</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lock in skin moisture with ceramides and organic rosehip oils.</p>
                </div>
              </div>
            )}
            {currentSeason === 'summer' && (
              <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Sun size={24} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <h4 style={{ fontWeight: 700 }}>Summer: Matte Sebum Control</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Broad spectrum non-comedogenic SPF gel to control oil under UV rays.</p>
                </div>
              </div>
            )}
            {currentSeason === 'monsoon' && (
              <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <CloudRain size={24} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <h4 style={{ fontWeight: 700 }}>Monsoon: Anti-Fungal Hygiene</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tea tree control washes and anti-fungal foot creams for damp streets.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SeasonHome;
