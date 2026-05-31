import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  TrendingDown,
  RefreshCw,
  Edit3
} from 'lucide-react';

const Inventory = () => {
  const { token, hasRole } = useAuth();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeason, setFilterSeason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Inline edit state
  // tracks { id: productId, field: 'stock' | 'min_stock_level' }
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const canEdit = hasRole(['owner', 'manager', 'order_staff']);

  useEffect(() => {
    const controller = new AbortController();
    fetchInventory(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token]);

  const fetchInventory = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!response.ok) throw new Error('Failed to fetch inventory logs');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  // Double Click Cell Trigger
  const handleCellDoubleClick = (itemId, fieldName, currentValue) => {
    if (!canEdit) return;
    setEditingCell({ id: itemId, field: fieldName });
    setEditValue(currentValue.toString());
  };

  // Save Inline Edit
  const handleSaveInlineEdit = async (itemId) => {
    if (!editingCell) return;
    
    const { field } = editingCell;
    const numericVal = parseInt(editValue);

    if (isNaN(numericVal) || numericVal < 0) {
      setError('Please enter a valid non-negative number');
      setEditingCell(null);
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const payload = {};
      payload[field] = numericVal;

      const response = await fetch(`${API_URL}/admin/inventory/${itemId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Inventory adjustment failed');

      // Update state local
      setItems(items.map(item => 
        item.id === itemId ? { ...item, [field]: numericVal } : item
      ));
      
      setSuccessMsg('Inventory adjusted successfully');
      setEditingCell(null);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setError(err.message || 'Error updating stock levels');
      setEditingCell(null);
    }
  };

  // Quick Restock Button (Adds stock)
  const handleQuickRestock = async (itemId, increment) => {
    if (!canEdit) return;
    
    setError('');
    setSuccessMsg('');
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) return;

    const newStock = targetItem.stock + increment;

    try {
      const response = await fetch(`${API_URL}/admin/inventory/${itemId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });

      if (!response.ok) throw new Error('Fulfillment restock api error');

      setItems(items.map(item => 
        item.id === itemId ? { ...item, stock: newStock } : item
      ));

      setSuccessMsg(`Restocked ${increment} units for "${targetItem.name}"`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setError(err.message || 'Error adjusting quick restock');
    }
  };

  // Stock computations
  const totalStockAlerts = items.filter(item => item.stock > 0 && item.stock <= item.min_stock_level).length;
  const outOfStockCount = items.filter(item => item.stock <= 0).length;
  const totalProductsCount = items.length;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeason = !filterSeason || item.season.toLowerCase() === filterSeason.toLowerCase();
    
    let matchesStatus = true;
    if (filterStatus === 'out') {
      matchesStatus = item.stock <= 0;
    } else if (filterStatus === 'low') {
      matchesStatus = item.stock > 0 && item.stock <= item.min_stock_level;
    } else if (filterStatus === 'healthy') {
      matchesStatus = item.stock > item.min_stock_level;
    }

    return matchesSearch && matchesSeason && matchesStatus;
  });

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

      {/* Top Inventory Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span>Total Skincare Lines</span>
            <div className="stat-value">{totalProductsCount}</div>
          </div>
          <div className="stat-icon-box stat-icon-blue">
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span>Out of Stock Items</span>
            <div className="stat-value" style={{ color: outOfStockCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {outOfStockCount}
            </div>
          </div>
          <div className="stat-icon-box stat-icon-red">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span>Low Stock Alerts</span>
            <div className="stat-value" style={{ color: totalStockAlerts > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {totalStockAlerts}
            </div>
          </div>
          <div className="stat-icon-box stat-icon-orange">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="catalog-toolbar">
        <div className="toolbar-search">
          <Search size={18} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search stock catalog..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Stock Status</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Low Stock Alert</option>
            <option value="out">Out of Stock</option>
          </select>

          <button className="btn-secondary" onClick={fetchInventory}>
            <RefreshCw size={16} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
        💡 <strong>Tip:</strong> Double-click any number in the <strong>Current Stock</strong> or <strong>Min Level</strong> columns to edit the value inline. Press Enter to save.
      </p>

      {/* Table grid */}
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
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Season</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Current Stock</th>
                <th style={{ textAlign: 'center' }}>Min Safety Level</th>
                <th>Status Indicators</th>
                {canEdit && <th style={{ width: '180px' }}>Quick Restock Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!filteredItems.length ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No stock records match filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOut = item.stock <= 0;
                  const isLow = item.stock > 0 && item.stock <= item.min_stock_level;

                  return (
                    <tr key={item.id} style={{
                      backgroundColor: isOut ? 'rgba(239, 68, 68, 0.08)' : isLow ? 'rgba(245, 158, 11, 0.05)' : 'inherit',
                      boxShadow: isOut ? 'inset 4px 0 0 #ef4444' : isLow ? 'inset 4px 0 0 #f59e0b' : 'none'
                    }}>
                      <td style={{ fontWeight: 700 }}>#SK{item.id}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>
                        <span className={`badge ${
                          item.season === 'winter' ? 'badge-info' :
                          item.season === 'summer' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {item.season}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{item.category}</td>
                      
                      {/* Current Stock Editable Cell */}
                      <td style={{ textAlign: 'center', cursor: canEdit ? 'double-click' : 'default' }}
                          onDoubleClick={() => handleCellDoubleClick(item.id, 'stock', item.stock)}>
                        {editingCell?.id === item.id && editingCell?.field === 'stock' ? (
                          <input
                            type="number"
                            className="inline-stock-edit"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.id);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: '1.05rem',
                            color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-success)',
                            textDecoration: canEdit ? 'underline dashed rgba(0,0,0,0.15)' : 'none',
                            cursor: 'pointer'
                          }} title={canEdit ? 'Double click to edit inline' : ''}>
                            {item.stock}
                          </span>
                        )}
                      </td>

                      {/* Min Safety Level Editable Cell */}
                      <td style={{ textAlign: 'center', cursor: canEdit ? 'double-click' : 'default' }}
                          onDoubleClick={() => handleCellDoubleClick(item.id, 'min_stock_level', item.min_stock_level)}>
                        {editingCell?.id === item.id && editingCell?.field === 'min_stock_level' ? (
                          <input
                            type="number"
                            className="inline-stock-edit"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.id);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ 
                            fontWeight: 600,
                            textDecoration: canEdit ? 'underline dashed rgba(0,0,0,0.15)' : 'none',
                            cursor: 'pointer'
                          }} title={canEdit ? 'Double click to edit inline' : ''}>
                            {item.min_stock_level}
                          </span>
                        )}
                      </td>

                      {/* Status indicator badge */}
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                            <AlertTriangle size={12} />
                            <span>Reorder Urgently</span>
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                            <CheckCircle size={12} />
                            <span>Stock Healthy</span>
                          </span>
                        )}
                      </td>

                      {/* Restock Buttons */}
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}
                              onClick={() => handleQuickRestock(item.id, 5)}
                            >
                              +5
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}
                              onClick={() => handleQuickRestock(item.id, 10)}
                            >
                              +10
                            </button>
                            {/* Direct Custom Refill input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.2rem' }}>
                              <input 
                                type="number" 
                                placeholder="Qty"
                                min="1"
                                id={`custom-restock-${item.id}`}
                                style={{ width: '60px', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseInt(e.target.value);
                                    if (val > 0) {
                                      handleQuickRestock(item.id, val);
                                      e.target.value = '';
                                    }
                                  }
                                }}
                              />
                              <button 
                                className="btn-primary" 
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem', minWidth: 'auto' }}
                                onClick={() => {
                                  const el = document.getElementById(`custom-restock-${item.id}`);
                                  const val = parseInt(el?.value || '0');
                                  if (val > 0) {
                                    handleQuickRestock(item.id, val);
                                    el.value = '';
                                  }
                                }}
                              >
                                Add
                              </button>
                            </div>
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
    </div>
  );
};

export default Inventory;
