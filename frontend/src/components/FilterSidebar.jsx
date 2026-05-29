import React from 'react';

const FilterSidebar = ({ filters, setFilters }) => {
  const handleCategoryChange = (category) => {
    const nextCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    setFilters({ ...filters, categories: nextCategories });
  };

  const handleRatingChange = (rating) => {
    setFilters({ ...filters, rating: filters.rating === rating ? null : rating });
  };

  const handlePriceChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value === '' ? '' : parseFloat(value)
    });
  };

  const handleSizeChange = (size) => {
    const nextSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    setFilters({ ...filters, sizes: nextSizes });
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      priceMin: '',
      priceMax: '',
      rating: null,
      sizes: []
    });
  };

  return (
    <aside className="filter-sidebar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.2rem' }}>Filters</h3>
        <button
          onClick={clearAllFilters}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-color)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Category</h4>
        {['Clothing', 'Accessories', 'Skincare'].map((cat) => (
          <label key={cat} className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={filters.categories.includes(cat.toLowerCase())}
              onChange={() => handleCategoryChange(cat.toLowerCase())}
            />
            <span>{cat}</span>
          </label>
        ))}
      </div>

      {/* Price Range Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Price Range</h4>
        <div className="price-range-inputs">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => handlePriceChange('priceMin', e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => handlePriceChange('priceMax', e.target.value)}
          />
        </div>
      </div>

      {/* Size / Variant Filter (Smart Filtering) */}
      {(filters.categories.length === 0 || filters.categories.includes('clothing')) && (
        <div className="filter-group">
          <h4 className="filter-group-title">Sizes</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
              const isSelected = filters.sizes.includes(sz);
              return (
                <button
                  key={sz}
                  onClick={() => handleSizeChange(sz)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--accent-color)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Star Rating Filter */}
      <div className="filter-group">
        <h4 className="filter-group-title">Minimum Rating</h4>
        {[4.5, 4.0, 3.5].map((stars) => (
          <label key={stars} className="filter-checkbox-label">
            <input
              type="radio"
              name="rating-filter"
              checked={filters.rating === stars}
              onChange={() => handleRatingChange(stars)}
            />
            <span>{stars} ★ & Above</span>
          </label>
        ))}
      </div>
    </aside>
  );
};

export default FilterSidebar;
