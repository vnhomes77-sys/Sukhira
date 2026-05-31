import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Snowflake, Sun, CloudRain } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import SkincareRoutineGuide from '../components/SkincareRoutineGuide';
import { API_URL } from '../config';

const categoryMap = {
  // Winter Clothing
  'sweaters': 'clothing',
  'hoodies': 'clothing',
  'thermal innerwear': 'clothing',
  'jackets & coats': 'clothing',
  'woolen socks': 'clothing',
  'gloves & mittens': 'clothing',
  'mufflers & scarves': 'clothing',
  'beanies & woolen caps': 'clothing',
  'shawls & blankets': 'clothing',
  'warm pajamas': 'clothing',

  // Winter Accessories
  'hot water bottles': 'accessories',
  'electric heating pads': 'accessories',
  'room heaters (small)': 'accessories',
  'thermos & insulated bottles': 'accessories',
  'woolen blankets & quilts': 'accessories',

  // Winter Skincare
  'moisturizing creams': 'skincare',
  'lip balms': 'skincare',
  'body lotions': 'skincare',
  'hand creams': 'skincare',
  'foot creams': 'skincare',
  'sunscreen': 'skincare',
  'face oils': 'skincare',
  'hydrating face masks': 'skincare',

  // Summer Clothing
  'cotton t-shirts': 'clothing',
  'linen shirts': 'clothing',
  'shorts & bermudas': 'clothing',
  'breathable cotton dresses': 'clothing',
  'sleeveless tops': 'clothing',
  'lightweight caps & hats': 'clothing',
  'sunglasses': 'clothing',

  // Summer Accessories
  'umbrellas (sun protection)': 'accessories',
  'handheld fans & mini fans': 'accessories',
  'water bottles & hydration flasks': 'accessories',
  'cooling towels': 'accessories',
  'tote bags': 'accessories',

  // Summer Skincare
  'sunscreens (spf 30/50)': 'skincare',
  'after-sun gels': 'skincare',
  'face mists': 'skincare',
  'cooling face masks': 'skincare',
  'lightweight moisturizers': 'skincare',
  'tinted lip balms': 'skincare',
  'body scrubs': 'skincare',

  // Monsoon Clothing
  'raincoats (men/women/kids)': 'clothing',
  'raincoats': 'clothing',
  'ponchos': 'clothing',
  'quick-dry t-shirts & tracks': 'clothing',
  'waterproof jackets': 'clothing',
  'rain boots & waterproof sandals': 'clothing',
  'waterproof caps': 'clothing',

  // Monsoon Accessories
  'umbrellas (rain)': 'accessories',
  'waterproof bags & backpacks': 'accessories',
  'waterproof phone pouches': 'accessories',
  'anti-slip footwear': 'accessories',
  'insect repellent products': 'accessories',
  'car rain covers': 'accessories',

  // Monsoon Skincare
  'anti-fungal foot creams': 'skincare',
  'oil-control face wash': 'skincare',
  'clay face masks': 'skincare',
  'lightweight non-greasy moisturizers': 'skincare',
  'anti-humidity hair serums': 'skincare',
  'waterproof sunscreen': 'skincare'
};

const sortOptions = [
  { value: 'newest', label: 'New Arrivals' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' }
];

const SortDropdown = ({ value, onChange, options, mobile = false }) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = () => setOpen(false);
    if (open) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [open]);

  return (
    <div className={mobile ? "mobile-sort-dropdown-container" : "sort-dropdown-container"} onClick={(e) => e.stopPropagation()}>
      <button 
        className={mobile ? "mobile-sort-select" : "sort-select"} 
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span>{mobile ? `Sort: ${selectedOption.label}` : selectedOption.label}</span>
      </button>
      {open && (
        <div className="custom-sort-dropdown-menu">
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`custom-sort-dropdown-item ${opt.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SeasonCollection = () => {
  const { season } = useParams();
  const location = useLocation();

  // Extract search and category queries
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get('search') || '';
  const categoryParam = queryParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  // Filters State
  const [filters, setFilters] = useState({
    categories: categoryParam ? [categoryParam.toLowerCase()] : [],
    priceMin: '',
    priceMax: '',
    rating: null,
    sizes: []
  });

  // Sync category parameter if it changes in URL
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categories: categoryParam ? [categoryParam.toLowerCase()] : []
    }));
  }, [categoryParam, season]);

  useEffect(() => {
    fetchSeasonalProducts();
  }, [season, searchParam]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [products, filters, sortBy]);

  const fetchSeasonalProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/products?season=${season}`;
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
      result = result.filter((p) => {
        const parent = categoryMap[p.category.toLowerCase()] || p.category.toLowerCase();
        return filters.categories.includes(parent);
      });
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
        title: 'The Winter Collection',
        desc: 'Curated layering pieces, insulated accessories, and lipid-rich skincare to survive cold dry winds.',
        gradient: 'linear-gradient(to right, #1a365d, #2b6cb0)'
      };
    } else if (season === 'summer') {
      return {
        title: 'The Summer Collection',
        desc: 'Breathable linen clothes, compact sun shields, and non-greasy cooling skincare items.',
        gradient: 'linear-gradient(to right, #7b341e, #dd6b20)'
      };
    } else {
      return {
        title: 'The Monsoon Collection',
        desc: 'Quick-dry active tracksuits, automatic windproof umbrellas, and anti-fungal hygiene sets.',
        gradient: 'linear-gradient(to right, #064e3b, #059669)'
      };
    }
  };

  const banner = getCollectionBannerDetails();

  const getSeasonIcon = (s) => {
    const iconStyle = { marginRight: '0.6rem', display: 'inline-block', verticalAlign: 'middle' };
    if (s === 'winter') return <Snowflake size={32} style={iconStyle} />;
    if (s === 'summer') return <Sun size={32} style={iconStyle} />;
    return <CloudRain size={32} style={iconStyle} />;
  };

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="collection-page">
      {/* Seasonal Header Banner */}
      <div
        className="collection-header-banner"
        style={{ background: banner.gradient }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 }} />
        <h1 style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {getSeasonIcon(season)}
          <span>{banner.title}</span>
        </h1>
        <p>{banner.desc}</p>
        {searchParam && (
          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', marginTop: '0.4rem', color: '#e2e8f0', zIndex: 2 }}>
            Showing results for: "{searchParam}"
          </p>
        )}
      </div>

      {/* Mobile Sticky / Floating Filter Sort Bar */}
      <div className="mobile-filter-sort-bar">
        <button className="mobile-filter-btn" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}>
          Filters
        </button>
        <div className="mobile-sort-select-wrapper">
          <SortDropdown
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            mobile={true}
          />
        </div>
      </div>

      <div className="collection-layout">
        {/* Filter Sidebar overlay for mobile */}
        <div 
          className={`mobile-drawer-overlay ${mobileFiltersOpen ? 'open' : ''}`} 
          onClick={() => setMobileFiltersOpen(false)} 
        />
        
        {/* Filter Sidebar */}
        <FilterSidebar 
          filters={filters} 
          setFilters={setFilters} 
          isOpen={mobileFiltersOpen} 
          onClose={() => setMobileFiltersOpen(false)} 
        />

        {/* Collection Grid Area */}
        <div className="collection-content">
          <div className="collection-toolbar">
            <span className="collection-results-count">
              Showing {filteredProducts.length} of {products.length} products
            </span>
            
            <div className="sort-select-wrapper">
              <span>Sort By:</span>
              <SortDropdown
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                mobile={false}
              />
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
