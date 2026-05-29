import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import SkincareRoutineGuide from '../components/SkincareRoutineGuide';

const SeasonCollection = () => {
  const { season } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  // Filters State
  const [filters, setFilters] = useState({
    categories: [],
    priceMin: '',
    priceMax: '',
    rating: null,
    sizes: []
  });

  // Extract search query
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get('search') || '';

  useEffect(() => {
    fetchSeasonalProducts();
  }, [season, searchParam]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [products, filters, sortBy]);

  const fetchSeasonalProducts = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/products?season=${season}`;
      if (searchParam) {
        url += `&search=${encodeURIComponent(searchParam)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching seasonal products:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let result = [...products];

    // Category Filter
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category.toLowerCase()));
    }

    // Price Filter
    if (filters.priceMin !== '') {
      result = result.filter((p) => p.price >= filters.priceMin);
    }
    if (filters.priceMax !== '') {
      result = result.filter((p) => p.price <= filters.priceMax);
    }

    // Rating Filter
    if (filters.rating !== null) {
      result = result.filter((p) => p.rating >= filters.rating);
    }

    // Size/Variant Filter
    if (filters.sizes.length > 0) {
      result = result.filter((p) => {
        // If product has variants, check if any match
        return p.variants && p.variants.some((v) => filters.sizes.includes(v));
      });
    }

    // Sorting
    if (sortBy === 'price-low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // New arrivals (id desc)
      result.sort((a, b) => b.id - a.id);
    }

    setFilteredProducts(result);
  };

  const getCollectionBannerDetails = () => {
    if (season === 'winter') {
      return {
        title: '❄️ The Winter Collection',
        desc: 'Curated layering pieces, insulated accessories, and lipid-rich skincare to survive cold dry winds.',
        gradient: 'linear-gradient(to right, #1a365d, #2b6cb0)'
      };
    } else if (season === 'summer') {
      return {
        title: '☀️ The Summer Collection',
        desc: 'Breathable linen clothes, compact sun shields, and non-greasy cooling skincare items.',
        gradient: 'linear-gradient(to right, #7b341e, #dd6b20)'
      };
    } else {
      return {
        title: '🌧️ The Monsoon Collection',
        desc: 'Quick-dry active tracksuits, automatic windproof umbrellas, and anti-fungal hygiene sets.',
        gradient: 'linear-gradient(to right, #064e3b, #059669)'
      };
    }
  };

  const banner = getCollectionBannerDetails();

  return (
    <div className="collection-page">
      {/* Seasonal Header Banner */}
      <div
        className="collection-header-banner"
        style={{ background: banner.gradient }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 }} />
        <h1>{banner.title}</h1>
        <p>{banner.desc}</p>
        {searchParam && (
          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', marginTop: '0.4rem', color: '#e2e8f0', zIndex: 2 }}>
            Showing results for: "{searchParam}"
          </p>
        )}
      </div>

      <div className="collection-layout">
        {/* Filter Sidebar */}
        <FilterSidebar filters={filters} setFilters={setFilters} />

        {/* Collection Grid Area */}
        <div className="collection-content">
          <div className="collection-toolbar">
            <span className="collection-results-count">
              Showing {filteredProducts.length} of {products.length} products
            </span>
            
            <div className="sort-select-wrapper">
              <span>Sort By:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">New Arrivals</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.2rem' }}>Loading season products...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>No products found matching the criteria.</p>
              <button
                onClick={() => setFilters({ categories: [], priceMin: '', priceMax: '', rating: null, sizes: [] })}
                className="btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skincare Routine Guide Accordion */}
      <SkincareRoutineGuide season={season} />
    </div>
  );
};

export default SeasonCollection;
