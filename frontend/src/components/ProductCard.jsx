import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, user } = useAuth();
  const { showNotification } = useNotification();

  const isWishlisted = wishlist.some((item) => item.product_id === product.id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showNotification('Please login to add items to your wishlist!', 'info');
      return;
    }
    toggleWishlist(product.id).catch((err) => showNotification(err.message, 'error'));
  };

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Default to first variant if exists
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    addToCart(product, 1, variant);
    // Visual feedback
    showNotification(`Added ${product.name} to cart!`, 'success');
  };

  // Safe fallback image
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60';

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`}>
        <div className="product-card-img-wrapper">
          <img src={imageUrl} alt={product.name} className="product-card-img" />
          
          <button
            onClick={handleWishlistClick}
            className={`wishlist-toggle-btn ${isWishlisted ? 'active' : ''}`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {product.is_spotlight && <span className="product-badge">Spotlight</span>}
        </div>

        <div className="product-card-info">
          <span className="product-card-category">{product.category}</span>
          <h4 className="product-card-name">{product.name}</h4>
          
          <div className="product-rating">
            <span className="star-rating-fill">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  size={14}
                  fill={idx < Math.round(product.rating || 4.5) ? "currentColor" : "none"}
                />
              ))}
            </span>
            <span>({product.rating || 4.5})</span>
          </div>

          <div className="product-card-footer">
            <span className="product-card-price">₹{product.price}</span>
            <button
              onClick={handleAddToCartClick}
              className="add-to-cart-btn"
              title="Add to Cart"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
