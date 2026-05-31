import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Grid
} from 'lucide-react';

const ALL_CATEGORIES = {
  winter: {
    'Clothing & Wearables': [
      { value: 'sweaters', label: 'Sweaters' },
      { value: 'hoodies', label: 'Hoodies' },
      { value: 'thermal innerwear', label: 'Thermal Innerwear' },
      { value: 'jackets & coats', label: 'Jackets & Coats' },
      { value: 'woolen socks', label: 'Woolen Socks' },
      { value: 'gloves & mittens', label: 'Gloves & Mittens' },
      { value: 'mufflers & scarves', label: 'Mufflers & Scarves' },
      { value: 'beanies & woolen caps', label: 'Beanies & Woolen Caps' },
      { value: 'shawls & blankets', label: 'Shawls & Blankets' },
      { value: 'warm pajamas', label: 'Warm Pajamas' }
    ],
    'Accessories & Home': [
      { value: 'hot water bottles', label: 'Hot Water Bottles' },
      { value: 'electric heating pads', label: 'Electric Heating Pads' },
      { value: 'room heaters (small)', label: 'Room Heaters (Small)' },
      { value: 'thermos & insulated bottles', label: 'Thermos & Insulated Bottles' },
      { value: 'woolen blankets & quilts', label: 'Woolen Blankets & Quilts' }
    ],
    'Skincare': [
      { value: 'moisturizing creams', label: 'Moisturizing Creams' },
      { value: 'lip balms', label: 'Lip Balms' },
      { value: 'body lotions', label: 'Body Lotions' },
      { value: 'hand creams', label: 'Hand Creams' },
      { value: 'foot creams', label: 'Foot Creams' },
      { value: 'sunscreen', label: 'Sunscreen' },
      { value: 'face oils', label: 'Face Oils' },
      { value: 'hydrating face masks', label: 'Hydrating Face Masks' }
    ]
  },
  summer: {
    'Clothing & Wearables': [
      { value: 'cotton t-shirts', label: 'Cotton T-shirts' },
      { value: 'linen shirts', label: 'Linen Shirts' },
      { value: 'shorts & bermudas', label: 'Shorts & Bermudas' },
      { value: 'breathable cotton dresses', label: 'Breathable Cotton Dresses' },
      { value: 'sleeveless tops', label: 'Sleeveless Tops' },
      { value: 'lightweight caps & hats', label: 'Lightweight Caps & Hats' },
      { value: 'sunglasses', label: 'Sunglasses' }
    ],
    'Accessories & Home': [
      { value: 'umbrellas (sun protection)', label: 'Umbrellas (Sun Protection)' },
      { value: 'handheld fans & mini fans', label: 'Handheld Fans & Mini Fans' },
      { value: 'water bottles & hydration flasks', label: 'Water Bottles & Hydration Flasks' },
      { value: 'cooling towels', label: 'Cooling Towels' },
      { value: 'tote bags', label: 'Tote Bags' }
    ],
    'Skincare': [
      { value: 'sunscreens (spf 30/50)', label: 'Sunscreens (SPF 30/50)' },
      { value: 'after-sun gels', label: 'After-Sun Gels' },
      { value: 'face mists', label: 'Face Mists' },
      { value: 'cooling face masks', label: 'Cooling Face Masks' },
      { value: 'lightweight moisturizers', label: 'Lightweight Moisturizers' },
      { value: 'tinted lip balms', label: 'Tinted Lip Balms' },
      { value: 'body scrubs', label: 'Body Scrubs' }
    ]
  },
  monsoon: {
    'Clothing & Wearables': [
      { value: 'raincoats (men/women/kids)', label: 'Raincoats (Men/Women/Kids)' },
      { value: 'raincoats', label: 'Raincoats' },
      { value: 'ponchos', label: 'Ponchos' },
      { value: 'quick-dry t-shirts & tracks', label: 'Quick-Dry T-shirts & Tracks' },
      { value: 'waterproof jackets', label: 'Waterproof Jackets' },
      { value: 'rain boots & waterproof sandals', label: 'Rain Boots & Waterproof Sandals' },
      { value: 'waterproof caps', label: 'Waterproof Caps' }
    ],
    'Accessories & Home': [
      { value: 'umbrellas (rain)', label: 'Umbrellas (Rain)' },
      { value: 'waterproof bags & backpacks', label: 'Waterproof Bags & Backpacks' },
      { value: 'waterproof phone pouches', label: 'Waterproof Phone Pouches' },
      { value: 'anti-slip footwear', label: 'Anti-slip Footwear' },
      { value: 'insect repellent products', label: 'Insect Repellent Products' },
      { value: 'car rain covers', label: 'Car Rain Covers' }
    ],
    'Skincare': [
      { value: 'anti-fungal foot creams', label: 'Anti-Fungal Foot Creams' },
      { value: 'oil-control face wash', label: 'Oil-Control Face Wash' },
      { value: 'clay face masks', label: 'Clay Face Masks' },
      { value: 'lightweight non-greasy moisturizers', label: 'Lightweight Non-Greasy Moisturizers' },
      { value: 'anti-humidity hair serums', label: 'Anti-Humidity Hair Serums' },
      { value: 'waterproof sunscreen', label: 'Waterproof Sunscreen' }
    ]
  }
};

const Products = () => {
  const { token, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected products for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeason, setFilterSeason] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    season: 'winter',
    category: 'sweaters',
    price: '',
    discount_price: '',
    stock: 15,
    min_stock_level: 4,
    status: 'active',
    images: [''],
    skincare_routine: [''],
    is_spotlight: false,
    is_featured: false,
    usage_instructions: ''
  });

  const canEdit = hasRole(['owner', 'manager']);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token]);

  // Check query params to open add modal
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      handleOpenAddModal();
      // Clear query param
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchProducts = async (signal) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!response.ok) throw new Error('Failed to fetch catalog');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    if (!canEdit) return;
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      season: 'winter',
      category: 'sweaters',
      price: '',
      discount_price: '',
      stock: 15,
      min_stock_level: 4,
      status: 'active',
      images: [''],
      skincare_routine: [''],
      is_spotlight: false,
      is_featured: false,
      usage_instructions: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    if (!canEdit) return;
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      season: product.season,
      category: product.category,
      price: product.price,
      discount_price: product.discount_price || '',
      stock: product.stock,
      min_stock_level: product.min_stock_level,
      status: product.status,
      images: product.images && product.images.length ? product.images : [''],
      skincare_routine: product.skincare_routine && product.skincare_routine.length ? product.skincare_routine : [''],
      is_spotlight: !!product.is_spotlight,
      is_featured: !!product.is_featured,
      usage_instructions: product.usage_instructions || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'season') {
      const firstGroup = Object.keys(ALL_CATEGORIES[value])[0];
      const firstCat = ALL_CATEGORIES[value][firstGroup][0].value;
      setFormData(prev => ({
        ...prev,
        season: value,
        category: firstCat
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Image URL helpers
  const handleImageURLChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    if (formData.images.length === 1) return;
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Routine step helpers
  const handleRoutineStepChange = (index, value) => {
    const newRoutine = [...formData.skincare_routine];
    newRoutine[index] = value;
    setFormData(prev => ({ ...prev, skincare_routine: newRoutine }));
  };

  const addRoutineStepField = () => {
    setFormData(prev => ({ ...prev, skincare_routine: [...prev.skincare_routine, ''] }));
  };

  const removeRoutineStepField = (index) => {
    if (formData.skincare_routine.length === 1) return;
    const newRoutine = formData.skincare_routine.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, skincare_routine: newRoutine }));
  };

  // Form Submit (Add / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Form validation
    if (!formData.name || !formData.price || !formData.images[0]) {
      setError('Please fill in Name, Price, and at least one image URL');
      return;
    }

    const payload = {
      ...formData,
      // Filter out empty image strings
      images: formData.images.filter(img => img.trim() !== ''),
      // Filter out empty skincare steps
      skincare_routine: formData.skincare_routine.filter(step => step.trim() !== '')
    };

    if (payload.images.length === 0) {
      setError('At least one valid image URL is required');
      return;
    }

    try {
      const url = editingProduct 
        ? `${API_URL}/admin/products/${editingProduct.id}`
        : `${API_URL}/admin/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setSuccessMsg(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setIsModalOpen(false);
      fetchProducts();
      
      // Auto clear message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error processing request');
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to delete this product? This action is permanent.')) return;
    
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Delete failed');
      }

      setSuccessMsg('Product deleted successfully');
      setProducts(products.filter(p => p.id !== id));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error deleting product');
    }
  };

  // Toggle single status directly
  const handleToggleStatus = async (product) => {
    if (!canEdit) return;
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    
    try {
      const response = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...product,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update state local
      setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    } catch (err) {
      setError('Failed to toggle status: ' + err.message);
    }
  };

  // Bulk actions handlers
  const handleSelectProduct = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filtered = filteredProducts.map(p => p.id);
      setSelectedIds(filtered);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkStatus = async (statusVal) => {
    if (!canEdit || !selectedIds.length) return;
    
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/products/bulk-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds, status: statusVal })
      });

      if (!response.ok) throw new Error('Bulk status update failed');

      setSuccessMsg(`Status updated to ${statusVal} for ${selectedIds.length} items.`);
      setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, status: statusVal } : p));
      setSelectedIds([]);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error executing bulk action');
    }
  };

  const handleBulkDelete = async () => {
    if (!canEdit || !selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/admin/products/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) throw new Error('Bulk delete failed');

      setSuccessMsg(`Successfully deleted ${selectedIds.length} products`);
      setProducts(products.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error executing bulk delete');
    }
  };

  // Filter computation
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = !filterSeason || product.season.toLowerCase() === filterSeason.toLowerCase();
    const matchesCategory = !filterCategory || product.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = !filterStatus || product.status.toLowerCase() === filterStatus.toLowerCase();
    
    let matchesStock = true;
    if (filterStock === 'out') {
      matchesStock = product.stock <= 0;
    } else if (filterStock === 'low') {
      matchesStock = product.stock > 0 && product.stock <= product.min_stock_level;
    } else if (filterStock === 'in') {
      matchesStock = product.stock > product.min_stock_level;
    }

    return matchesSearch && matchesSeason && matchesCategory && matchesStatus && matchesStock;
  });

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div>
      {/* Messages */}
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--color-success)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="catalog-toolbar">
        <div className="toolbar-search">
          <Search size={18} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search products, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select 
            className="filter-select"
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
          >
            <option value="">All Seasons</option>
            <option value="winter">Winter</option>
            <option value="summer">Summer</option>
            <option value="monsoon">Monsoon</option>
          </select>

          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {filterSeason ? (
              Object.keys(ALL_CATEGORIES[filterSeason]).map(parentGroup => (
                <optgroup key={parentGroup} label={parentGroup}>
                  {ALL_CATEGORIES[filterSeason][parentGroup].map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </optgroup>
              ))
            ) : (
              Object.keys(ALL_CATEGORIES).map(seasonKey => (
                <optgroup key={seasonKey} label={seasonKey.toUpperCase()}>
                  {Object.keys(ALL_CATEGORIES[seasonKey]).map(parentGroup => (
                    ALL_CATEGORIES[seasonKey][parentGroup].map(cat => (
                      <option key={`${seasonKey}-${cat.value}`} value={cat.value}>{cat.label} ({seasonKey})</option>
                    ))
                  ))}
                </optgroup>
              ))
            )}
          </select>

          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>

          <select 
            className="filter-select"
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
          >
            <option value="">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          {canEdit && (
            <button className="btn-primary" onClick={handleOpenAddModal}>
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && (
        <div style={{
          backgroundColor: '#0f172a',
          color: 'white',
          borderRadius: 'var(--border-radius-md)',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {selectedIds.length} products selected
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                className="btn-success" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                onClick={() => handleBulkStatus('active')}
              >
                Set Active
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', backgroundColor: '#334155', color: 'white', borderColor: '#475569' }}
                onClick={() => handleBulkStatus('draft')}
              >
                Set Draft
              </button>
              <button 
                className="btn-danger" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                onClick={handleBulkDelete}
              >
                <Trash2 size={14} />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Image</th>
                <th>Product Info</th>
                <th>Season</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!filteredProducts.length ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.min_stock_level;
                  const isOut = p.stock <= 0;
                  
                  return (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectProduct(p.id)}
                        />
                      </td>
                      <td>
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=80'}
                          alt={p.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                        {p.discount_price > 0 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 500 }}>
                            On Sale
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          p.season === 'winter' ? 'badge-info' :
                          p.season === 'summer' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {p.season}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                      <td>
                        {p.discount_price > 0 ? (
                          <div>
                            <span style={{ fontWeight: 700 }}>{formatINR(p.discount_price)}</span>
                            <span style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              textDecoration: 'line-through',
                              marginLeft: '0.4rem'
                            }}>
                              {formatINR(p.price)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700 }}>{formatINR(p.price)}</span>
                        )}
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                            <AlertTriangle size={12} />
                            <span>Low ({p.stock})</span>
                          </span>
                        ) : (
                          <span className="badge badge-success">{p.stock} Units</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          disabled={!canEdit}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: canEdit ? 'pointer' : 'default',
                            color: p.status === 'active' ? 'var(--color-success)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={canEdit ? 'Click to toggle status' : ''}
                        >
                          {p.status === 'active' ? (
                            <ToggleRight size={32} />
                          ) : (
                            <ToggleLeft size={32} style={{ color: '#cbd5e1' }} />
                          )}
                          <span style={{ fontSize: '0.8rem', marginLeft: '0.4rem', fontWeight: 600 }}>
                            {p.status}
                          </span>
                        </button>
                      </td>
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Product"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                              onClick={() => handleDelete(p.id)}
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Skincare Product'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Section 1: Basic */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', color: 'var(--accent-color)', fontFamily: 'var(--font-title)' }}>
                  Basic Product Info
                </h4>
                
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Season *</label>
                    <select
                      name="season"
                      className="form-control"
                      value={formData.season}
                      onChange={handleInputChange}
                    >
                      <option value="winter">Winter</option>
                      <option value="summer">Summer</option>
                      <option value="monsoon">Monsoon</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {Object.keys(ALL_CATEGORIES[formData.season]).map(groupName => (
                        <optgroup key={groupName} label={groupName}>
                          {ALL_CATEGORIES[formData.season][groupName].map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Base Price (INR) *</label>
                    <input
                      type="number"
                      name="price"
                      className="form-control"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 599"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Discounted Price (INR) - Optional</label>
                    <input
                      type="number"
                      name="discount_price"
                      className="form-control"
                      value={formData.discount_price}
                      onChange={handleInputChange}
                      placeholder="e.g. 499 (leave blank if none)"
                    />
                  </div>
                </div>

                {/* Section 2: Stock & Inventory */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: '1.5rem', color: 'var(--accent-color)', fontFamily: 'var(--font-title)' }}>
                  Inventory & Visibility
                </h4>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Current Stock Units</label>
                    <input
                      type="number"
                      name="stock"
                      className="form-control"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Min Stock Warning Level</label>
                    <input
                      type="number"
                      name="min_stock_level"
                      className="form-control"
                      value={formData.min_stock_level}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center', marginBottom: 0 }}>
                    <label className="checkbox-label-flex">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                      />
                      <span>Feature on Storefront</span>
                    </label>
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center', marginBottom: 0 }}>
                    <label className="checkbox-label-flex">
                      <input
                        type="checkbox"
                        name="is_spotlight"
                        checked={formData.is_spotlight}
                        onChange={handleInputChange}
                      />
                      <span>Spotlight on Home Page Banner</span>
                    </label>
                  </div>
                </div>

                {/* Section 3: Descriptions */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: '1.5rem', color: 'var(--accent-color)', fontFamily: 'var(--font-title)' }}>
                  Product Details
                </h4>

                <div className="form-group">
                  <label>Product Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe key ingredients, skin suitability, texture, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Usage Instructions</label>
                  <textarea
                    name="usage_instructions"
                    className="form-control"
                    value={formData.usage_instructions}
                    onChange={handleInputChange}
                    placeholder="Instructions on how to apply, frequency, precautions..."
                  />
                </div>

                {/* Section 4: Image URLs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
                  <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', margin: 0 }}>
                    Product Images (URLs) *
                  </h4>
                  <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }} onClick={addImageField}>
                    <PlusCircle size={14} style={{ marginRight: '0.3rem' }} /> Add Image URL
                  </button>
                </div>

                {formData.images.map((imgUrl, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '60px', fontWeight: 600 }}>
                      Img {index + 1}:
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://images.unsplash.com/..."
                      value={imgUrl}
                      onChange={(e) => handleImageURLChange(index, e.target.value)}
                      required={index === 0}
                    />
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      onClick={() => removeImageField(index)}
                      disabled={formData.images.length === 1}
                    >
                      <MinusCircle size={20} />
                    </button>
                  </div>
                ))}

                {/* Section 5: Skincare Routine Steps */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
                  <h4 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-title)', margin: 0 }}>
                    Skincare Routine Guide (JSON Steps)
                  </h4>
                  <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }} onClick={addRoutineStepField}>
                    <PlusCircle size={14} style={{ marginRight: '0.3rem' }} /> Add step
                  </button>
                </div>
                
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Explain the ordering process. e.g. "Step 1: Wash skin with cleanser", "Step 2: Apply toner", etc. These steps will show up in the consumer's routine guide.
                </p>

                {formData.skincare_routine.map((stepText, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '60px', fontWeight: 600 }}>
                      Step {index + 1}:
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder='e.g. Wash face with Cleanser and dry gently'
                      value={stepText}
                      onChange={(e) => handleRoutineStepChange(index, e.target.value)}
                    />
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      onClick={() => removeRoutineStepField(index)}
                      disabled={formData.skincare_routine.length === 1}
                    >
                      <MinusCircle size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
