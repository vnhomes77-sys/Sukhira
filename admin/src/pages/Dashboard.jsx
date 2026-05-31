import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Plus,
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [seasonSales, setSeasonSales] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isManagement = ['owner', 'manager'].includes(user?.role);

  useEffect(() => {
    if (!isManagement) {
      setLoading(false);
      return; // Skip stats fetch for order_staff / support to avoid 403
    }

    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Failed to load dashboard metrics');
        }

        const data = await response.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setSeasonSales(data.seasonSales || []);
        setTopSelling(data.topSelling || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError(err.message || 'Error fetching dashboard stats');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    return () => controller.abort();
  }, [token, isManagement]);

  // Format currency
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Render alternative welcome panel for non-management staff (staff, support)
  if (!isManagement) {
    return (
      <div>
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          color: 'white',
          borderRadius: 'var(--border-radius-lg)',
          padding: '3rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.15), transparent 40%)'
        }}>
          <div style={{
            padding: '1.2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            color: 'var(--accent-color)'
          }}>
            <ShieldCheck size={48} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800 }}>
              Welcome back, {user?.name}!
            </h2>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '600px' }}>
              You are signed in with the <strong>{user?.role === 'order_staff' ? 'Order Fulfillment Staff' : 'Customer Support'}</strong> role. Use the sidebar menu or quick links below to perform your assigned duties.
            </p>
          </div>
        </div>

        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Quick Actions Workflow
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {['owner', 'manager', 'order_staff'].includes(user?.role) && (
            <div className="stat-card" style={{ cursor: 'pointer', display: 'block' }} onClick={() => navigate('/orders')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon-box stat-icon-blue"><ShoppingCart size={24} /></div>
                <ArrowRight size={20} />
              </div>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700 }}>Orders Registry</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Fulfill placed orders, update delivery tracking labels, pack items, and record support tickets.
              </p>
            </div>
          )}

          {['owner', 'manager', 'order_staff'].includes(user?.role) && (
            <div className="stat-card" style={{ cursor: 'pointer', display: 'block' }} onClick={() => navigate('/inventory')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon-box stat-icon-orange"><Package size={24} /></div>
                <ArrowRight size={20} />
              </div>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700 }}>Inventory Logs</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Monitor current stocks, configure min-threshold safety marks, and execute inline edits.
              </p>
            </div>
          )}

          {['owner', 'manager', 'support'].includes(user?.role) && (
            <div className="stat-card" style={{ cursor: 'pointer', display: 'block' }} onClick={() => navigate('/products')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon-box stat-icon-green"><Package size={24} /></div>
                <ArrowRight size={20} />
              </div>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700 }}>Catalog Directory</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Browse skincare lists, verify pricing details, check ingredient guidelines, and inspect skincare routines.
              </p>
            </div>
          )}

          {['owner', 'manager', 'support'].includes(user?.role) && (
            <div className="stat-card" style={{ cursor: 'pointer', display: 'block' }} onClick={() => navigate('/customers')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="stat-icon-box stat-icon-red"><Users size={24} /></div>
                <ArrowRight size={20} />
              </div>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700 }}>Customer Registry</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Inspect registered users profiles, order purchases summary, and handle customer blocks.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Seasons sales data helper mapping database output
  const salesShare = useMemo(() => {
    if (!seasonSales.length) return { winter: 0, summer: 0, monsoon: 0 };
    const total = seasonSales.reduce((acc, curr) => acc + curr.sales, 0);
    if (!total) return { winter: 0, summer: 0, monsoon: 0 };
    
    const findSales = (sName) => {
      const match = seasonSales.find(s => s.season.toLowerCase() === sName.toLowerCase());
      return match ? (match.sales / total) * 100 : 0;
    };

    return {
      winter: findSales('winter'),
      summer: findSales('summer'),
      monsoon: findSales('monsoon')
    };
  }, [seasonSales]);

  return (
    <div>
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

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span>Orders Today</span>
            <div className="stat-value">{stats?.ordersToday || 0}</div>
          </div>
          <div className="stat-icon-box stat-icon-blue">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span>Revenue Today</span>
            <div className="stat-value">{formatINR(stats?.revenueToday || 0)}</div>
          </div>
          <div className="stat-icon-box stat-icon-green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span>Monthly Revenue</span>
            <div className="stat-value">{formatINR(stats?.revenueMonth || 0)}</div>
          </div>
          <div className="stat-icon-box stat-icon-blue">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span>Stock Alerts</span>
            <div className="stat-value" style={{ color: (stats?.lowStockAlerts || 0) > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {stats?.lowStockAlerts || 0}
            </div>
          </div>
          <div className="stat-icon-box stat-icon-red">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Quick Action Control Strip */}
      <div className="quick-actions-bar">
        <div className="quick-actions-title">Administrative Actions</div>
        <div className="quick-actions-buttons">
          <button className="btn-primary" onClick={() => navigate('/products?add=true')}>
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
          <button className="btn-secondary" onClick={() => navigate('/orders')}>
            <span>Manage Orders</span>
          </button>
          <button className="btn-secondary" onClick={() => navigate('/inventory')}>
            <span>Check Inventory</span>
          </button>
          {user?.role === 'owner' && (
            <button className="btn-secondary" onClick={() => navigate('/settings')}>
              <span>Store Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dash Charts and Details Grid */}
      <div className="dashboard-grid">
        {/* Left Side: Recent Bookings Table */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-flex">
            <div className="card-title">Recent Orders</div>
            <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => navigate('/orders')}>
              View All
            </button>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            {!recentOrders.length ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent bookings recorded.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700 }}>#SK{ord.id}</td>
                      <td>{ord.customer_name}</td>
                      <td>{new Date(ord.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{formatINR(ord.total)}</td>
                      <td>
                        <span className={`badge ${
                          ord.status === 'delivered' ? 'badge-success' :
                          ord.status === 'cancelled' ? 'badge-danger' :
                          ord.status === 'shipped' || ord.status === 'out_for_delivery' ? 'badge-info' :
                          'badge-warning'
                        }`}>
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => navigate(`/orders?id=${ord.id}`)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Visual Metrics & Top Sellers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Seasonal Share Widget */}
          <div className="dashboard-card">
            <div className="card-header-flex" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
              <div className="card-title">Seasonal Revenue Share</div>
            </div>
            
            <div className="sales-chart-container">
              <div className="chart-row">
                <div className="chart-label">Winter</div>
                <div className="chart-bar-outer">
                  <div className="chart-bar-inner chart-bar-winter" style={{ width: `${salesShare.winter}%` }} />
                </div>
                <div className="chart-value">{salesShare.winter.toFixed(1)}%</div>
              </div>

              <div className="chart-row">
                <div className="chart-label">Summer</div>
                <div className="chart-bar-outer">
                  <div className="chart-bar-inner chart-bar-summer" style={{ width: `${salesShare.summer}%` }} />
                </div>
                <div className="chart-value">{salesShare.summer.toFixed(1)}%</div>
              </div>

              <div className="chart-row">
                <div className="chart-label">Monsoon</div>
                <div className="chart-bar-outer">
                  <div className="chart-bar-inner chart-bar-monsoon" style={{ width: `${salesShare.monsoon}%` }} />
                </div>
                <div className="chart-value">{salesShare.monsoon.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Top Selling Products Block */}
          <div className="dashboard-card">
            <div className="card-header-flex" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
              <div className="card-title">Top Selling Products</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!topSelling.length ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No transaction data available yet.
                </div>
              ) : (
                topSelling.map((prod) => (
                  <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=80'}
                      alt={prod.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--border-radius-sm)',
                        objectFit: 'cover',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {prod.season} • {prod.category}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{prod.total_sold} Sold</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatINR(prod.price)} ea.</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
