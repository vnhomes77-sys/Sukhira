import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ShieldAlert, Award, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ProductCard from '../components/ProductCard';
import { API_URL } from '../config';

const ProductDetail = ({ setActiveSeason }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, user } = useAuth();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Zoom State
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });

  // Add Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        if (setActiveSeason) {
          setActiveSeason(data.season);
        }
        setActiveImageIdx(0);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        } else {
          setSelectedVariant('');
        }

        // Fetch related products (same season, exclude current)
        const relRes = await fetch(`${API_URL}/products?season=${data.season}`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelatedProducts(relData.filter((p) => p.id !== data.id).slice(0, 4));
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error fetching product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageMouseMove = (e) => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleImageMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant || null);
    showNotification(`Added ${quantity} x ${product.name} (${selectedVariant || 'Standard'}) to cart!`, 'success');
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant || null);
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    if (!user) {
      showNotification('Please login to wishlist products!', 'info');
      return;
    }
    toggleWishlist(product.id).catch((err) => showNotification(err.message, 'error'));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      showNotification('Please fill out all review fields', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: reviewName,
          rating: parseInt(reviewRating),
          comment: reviewComment
        })
      });
      if (res.ok) {
        showNotification('Review submitted successfully!', 'success');
        setReviewName('');
        setReviewComment('');
        setReviewRating(5);
        fetchProductDetails(); // reload details to see new review
      } else {
        const data = await res.json();
        showNotification(data.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '10rem', fontSize: '1.5rem' }}>Loading product details...</div>;
  }

  const isWishlisted = wishlist.some((item) => item.product_id === product.id);

  return (
    <div className="product-detail-page">
      <div className="product-detail-layout">
        {/* Gallery Column */}
        <div className="product-gallery">
          <div
            className="main-image-zoom-container"
            onMouseMove={handleImageMouseMove}
            onMouseLeave={handleImageMouseLeave}
          >
            <img
              src={product.images[activeImageIdx]}
              alt={product.name}
              style={zoomStyle}
            />
          </div>
          <div className="thumbnail-row">
            {product.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumbnail ${idx}`}
                className={`thumbnail-img ${activeImageIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveImageIdx(idx)}
              />
            ))}
          </div>
        </div>

        {/* Product Details Column */}
        <div className="product-info-column">
          <span className="product-meta-tag">{product.season} • {product.category}</span>
          <h1 className="product-detail-name">{product.name}</h1>
          
          <div className="product-detail-rating">
            <span className="star-rating-fill">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  size={18}
                  fill={idx < Math.round(product.rating) ? "currentColor" : "none"}
                />
              ))}
            </span>
            <span style={{ fontWeight: 600 }}>{product.rating} / 5.0</span>
            <span style={{ color: 'var(--text-muted)' }}>({product.reviews ? product.reviews.length : 0} reviews)</span>
          </div>

          <div className="product-detail-price">₹{product.price}</div>

          <p className="product-detail-desc">{product.description}</p>

          {/* Skincare Spotlight usage guidelines */}
          {product.category === 'skincare' && product.usage_instructions && (
            <div className="skincare-usage-panel">
              <h4>
                <ShieldAlert size={16} />
                Seasonal Application Guide
              </h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{product.usage_instructions}</p>
            </div>
          )}

          {/* Key Features Block */}
          {product.features && product.features.length > 0 && (
            <ul className="product-features-list">
              {product.features.map((feat, idx) => (
                <li key={idx}>{feat}</li>
              ))}
            </ul>
          )}

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="product-selector-group">
              <span className="selector-label">Select Options:</span>
              <div className="variant-buttons">
                {product.variants.map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setSelectedVariant(variant)}
                    className={`variant-btn ${selectedVariant === variant ? 'active' : ''}`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="product-selector-group">
            <span className="selector-label">Quantity:</span>
            <div className="qty-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn">-</button>
              <div className="qty-value">{quantity}</div>
              <button onClick={() => setQuantity(quantity + 1)} className="qty-btn">+</button>
            </div>
          </div>

          {/* Action Row */}
          <div className="detail-actions-row">
            <button onClick={handleAddToCart} className="btn-primary">
              <ShoppingCart size={20} />
              <span>Add to Cart</span>
            </button>
            <button onClick={handleBuyNow} className="btn-primary btn-buy-now">
              <span>Buy Now</span>
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`wishlist-toggle-btn ${isWishlisted ? 'active' : ''}`}
              style={{ position: 'static', transform: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', width: '50px', height: '50px' }}
              title="Add to Wishlist"
            >
              <Heart size={22} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Service Promises */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>
              <Award size={20} style={{ margin: '0 auto 0.4rem auto', color: 'var(--accent-color)' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>100% Genuine</div>
              Quality assured
            </div>
            <div>
              <RefreshCw size={20} style={{ margin: '0 auto 0.4rem auto', color: 'var(--accent-color)' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>7 Day Return</div>
              Hassle-free replacement
            </div>
            <div>
              <ShieldAlert size={20} style={{ margin: '0 auto 0.4rem auto', color: 'var(--accent-color)' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Secure Checkout</div>
              SSL encrypted payments
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="reviews-section">
        <h3>Customer Reviews</h3>
        <div className="reviews-layout">
          {/* Summary Ratings Column */}
          <div className="reviews-summary">
            <div className="rating-number">{product.rating}</div>
            <div className="star-rating-fill" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  size={20}
                  fill={idx < Math.round(product.rating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Average Product Rating</div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="add-review-form">
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '1rem' }}>Write a Review</h4>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(parseInt(e.target.value))}>
                  <option value="5">5 Stars (Excellent)</option>
                  <option value="4">4 Stars (Good)</option>
                  <option value="3">3 Stars (Average)</option>
                  <option value="2">2 Stars (Poor)</option>
                  <option value="1">1 Star (Very Bad)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Written Comment</label>
                <textarea
                  rows="4"
                  placeholder="Share your experience with this seasonal product..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="btn-primary"
                style={{ width: '100%', padding: '0.6rem' }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          {/* List of Reviews Column */}
          <div className="review-list">
            {(!product.reviews || product.reviews.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', color: 'var(--text-muted)' }}>
                No reviews yet for this product. Be the first to share your thoughts!
              </div>
            ) : (
              product.reviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div className="review-header">
                    <span className="review-author">{rev.user_name}</span>
                    <span className="review-date">
                      {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="star-rating-fill" style={{ marginBottom: '0.6rem' }}>
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        size={14}
                        fill={idx < rev.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <p className="review-comment">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', paddingTop: '4rem' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', marginBottom: '2rem' }}>
            More from the {product.season.charAt(0).toUpperCase() + product.season.slice(1)} Collection
          </h3>
          <div className="product-grid">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
