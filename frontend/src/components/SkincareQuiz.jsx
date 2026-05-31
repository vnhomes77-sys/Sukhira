import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { Sparkles, Check, ArrowRight, RefreshCw, ShoppingCart } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';

const SkincareQuiz = ({ season = 'winter' }) => {
  const { addToCart, applyCoupon } = useCart();
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(0); // 0: Start, 1: Skin Type, 2: Skin Concern, 3: Results
  const [skinType, setSkinType] = useState('');
  const [concern, setConcern] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const quizTimerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    // Load products to filter for recommendations
    fetch(`${API_URL}/products`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error loading products for quiz:', err);
        }
      });

    return () => {
      controller.abort();
      if (quizTimerRef.current) {
        clearTimeout(quizTimerRef.current);
      }
    };
  }, []);

  const resetQuiz = () => {
    setStep(0);
    setSkinType('');
    setConcern('');
    setRecommendations([]);
    setAddedToCart(false);
  };

  const startQuiz = () => {
    setStep(1);
  };

  const handleSelectSkinType = (type) => {
    setSkinType(type);
    setStep(2);
  };

  const handleSelectConcern = (selectedConcern) => {
    setConcern(selectedConcern);
    generateRecommendations(skinType, selectedConcern);
  };

  const generateRecommendations = (type, cnrn) => {
    setLoading(true);
    // Simulate smart AI analyzer delay
    quizTimerRef.current = setTimeout(() => {
      // Filter skincare products for the selected season
      const skincareItems = products.filter(
        p => p.season.toLowerCase() === season.toLowerCase() && p.category.toLowerCase() === 'skincare'
      );

      // Simple heuristic mapping to matching items
      let recommendedList = [];

      // We want to suggest: 1 Cleanser/Wash, 1 Moisturizer/Gel, 1 Treatment/Sunscreen
      const cleansers = skincareItems.filter(p => p.name.toLowerCase().includes('wash') || p.name.toLowerCase().includes('cleans') || p.name.toLowerCase().includes('scrub'));
      const moisturizers = skincareItems.filter(p => p.name.toLowerCase().includes('cream') || p.name.toLowerCase().includes('lotion') || p.name.toLowerCase().includes('moisturizer') || p.name.toLowerCase().includes('gel') || p.name.toLowerCase().includes('oil'));
      const treatments = skincareItems.filter(p => !cleansers.includes(p) && !moisturizers.includes(p));

      // Fallbacks if lists are empty
      const cleanItem = cleansers[0] || skincareItems[0];
      const moistItem = moisturizers[0] || skincareItems[1] || skincareItems[0];
      const treatItem = treatments[0] || skincareItems[2] || skincareItems[0];

      if (cleanItem) recommendedList.push(cleanItem);
      if (moistItem && moistItem.id !== cleanItem?.id) recommendedList.push(moistItem);
      if (treatItem && treatItem.id !== cleanItem?.id && treatItem.id !== moistItem?.id) recommendedList.push(treatItem);

      // Ensure we have at least 2 or 3 items
      if (recommendedList.length < 3 && skincareItems.length >= 3) {
        skincareItems.forEach(item => {
          if (recommendedList.length < 3 && !recommendedList.find(r => r.id === item.id)) {
            recommendedList.push(item);
          }
        });
      }

      setRecommendations(recommendedList);
      setStep(3);
      setLoading(false);
    }, 1000);
  };

  const handleAddAllToCart = () => {
    recommendations.forEach(prod => {
      // Find dynamic sizes if available, otherwise default to first or null
      const variants = Array.isArray(prod.variants) ? prod.variants : (typeof prod.variants === 'string' ? JSON.parse(prod.variants) : []);
      const variant = variants.length > 0 ? variants[0] : null;
      addToCart(prod, 1, variant);
    });
    if (applyCoupon) {
      applyCoupon('ROUTINE10');
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const skinTypes = [
    { id: 'dry', label: 'Dry / Flaky', desc: 'Lacks moisture, feels tight or rough' },
    { id: 'oily', label: 'Oily / Shiny', desc: 'Excess sebum, visible pores, acne-prone' },
    { id: 'combination', label: 'Combination', desc: 'Oily T-zone (forehead, nose) but dry cheeks' },
    { id: 'sensitive', label: 'Sensitive', desc: 'Easily irritated, prone to redness or itching' }
  ];

  const concerns = [
    { id: 'dryness', label: 'Dehydration & Flakiness', desc: 'Needs deep barrier replenishment' },
    { id: 'acne', label: 'Pores & Active Breakouts', desc: 'Needs sebum control & antibacterial defense' },
    { id: 'dullness', label: 'Dark Spots & Uneven Tone', desc: 'Needs brightening & gentle exfoliation' },
    { id: 'protection', label: 'Sun Exposure & Redness', desc: 'Needs soothing cooling & high SPF protection' }
  ];

  return (
    <div className="skincare-quiz-section" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius)',
      padding: '2.5rem',
      margin: '4rem 0',
      boxShadow: 'var(--shadow-md)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative sparkles */}
      <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', opacity: 0.15, color: 'var(--accent-color)' }}>
        <Sparkles size={48} />
      </div>

      {step === 0 && (
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--accent-color)',
            background: 'var(--accent-light)',
            padding: '0.4rem 1rem',
            borderRadius: '30px',
            letterSpacing: '1.5px',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            Skincare Advisor
          </span>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem' }}>
            Find Your Perfect Seasonal Routine
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Our dynamic skincare advisor matches your skin type and concerns with the most effective ingredients for the <span style={{ color: 'var(--accent-color)', fontWeight: 700, textTransform: 'capitalize' }}>{season}</span> season.
          </p>
          <button onClick={startQuiz} className="btn-primary" style={{ padding: '0.8rem 2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Start Skin Assessment</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
            Select Your Skin Type
          </h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
            Step 1 of 2: Let's understand your base skin attributes
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {skinTypes.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectSkinType(t.id)}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  background: 'var(--bg-app)',
                  textAlign: 'left'
                }}
                className="quiz-card-hover"
              >
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>{t.label}</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
            What is Your Primary Concern?
          </h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
            Step 2 of 2: Tell us what you want to address for {season}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {concerns.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConcern(c.id)}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  background: 'var(--bg-app)',
                  textAlign: 'left'
                }}
                className="quiz-card-hover"
              >
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>{c.label}</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <div style={{ padding: '3rem 0' }}>
              <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--accent-color)' }} />
              <p style={{ fontWeight: 600 }}>Analyzing skin profile and formulating routine...</p>
            </div>
          ) : (
            <div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '0.4rem 1rem',
                borderRadius: '30px',
                display: 'inline-block',
                marginBottom: '1rem'
              }}>
                Routine Formulated Successfully!
              </span>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>
                Your Recommended {season.charAt(0).toUpperCase() + season.slice(1)} Routine
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {recommendations.map((prod, idx) => {
                  const images = Array.isArray(prod.images) ? prod.images : (typeof prod.images === 'string' ? JSON.parse(prod.images) : []);
                  const imgUrl = images[0] || `${BASE_URL}/placeholder.jpg`;
                  const stepsOrder = ['1. CLEANSE', '2. MOISTURIZE', '3. PROTECT'];
                  return (
                    <div
                      key={prod.id}
                      style={{
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.2rem',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '0.8rem',
                        left: '0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--accent-color)',
                        background: 'var(--accent-light)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px'
                      }}>
                        {stepsOrder[idx] || 'CARE STEP'}
                      </span>
                      <img
                        src={imgUrl}
                        alt={prod.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          margin: '1.5rem 0 1rem 0'
                        }}
                      />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.2rem 0', minHeight: '2.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prod.name}
                      </h4>
                      <div style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.05rem', marginTop: '0.4rem' }}>
                        ₹{prod.price}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAddAllToCart}
                  className="btn-primary"
                  style={{ padding: '0.8rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
                >
                  {addedToCart ? <Check size={18} /> : <ShoppingCart size={18} />}
                  <span>{addedToCart ? 'Routine Added!' : 'Add Full Routine to Cart (10% Off)'}</span>
                </button>
                <button
                  onClick={resetQuiz}
                  className="btn-secondary"
                  style={{ padding: '0.8rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
                >
                  <RefreshCw size={16} />
                  <span>Start Over</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkincareQuiz;
