import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  RefreshCw,
  PieChart,
  DollarSign,
  Activity,
  ArrowUpRight
} from 'lucide-react';

const Analytics = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalyticsData(controller.signal);
    return () => controller.abort();
  }, [token]);

  const fetchAnalyticsData = async (signal) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Sales Trends
      const salesResponse = await fetch(`${API_URL}/admin/analytics/sales-trend`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!salesResponse.ok) throw new Error('Failed to fetch sales trends');
      const salesJson = await salesResponse.json();
      setSalesData(salesJson);

      // 2. Fetch Performance
      const perfResponse = await fetch(`${API_URL}/admin/analytics/performance`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal
      });
      if (!perfResponse.ok) throw new Error('Failed to fetch product performance rankings');
      const perfJson = await perfResponse.json();
      setPerformanceData(perfJson);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error compiling analytics boards');
    } finally {
      setLoading(false);
    }
  };

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

  // Draw SVG Line Chart for Monthly Sales
  const renderMonthlyChart = () => {
    const monthlyList = salesData?.monthlySales || [];
    if (!monthlyList.length) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No monthly trends recorded.</div>;
    }

    // Chart Dimensions
    const width = 600;
    const height = 260;
    const padding = 40;

    // Find min / max values for scaling
    const revenues = monthlyList.map(d => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000);
    const minRevenue = 0;

    // Grid coordinates helper
    const getX = (index) => {
      if (monthlyList.length <= 1) return padding + (width - padding * 2) / 2;
      return padding + (index / (monthlyList.length - 1)) * (width - padding * 2);
    };

    const getY = (value) => {
      const range = maxRevenue - minRevenue;
      const pct = (value - minRevenue) / range;
      return height - padding - pct * (height - padding * 2);
    };

    // Construct SVG Path
    let pathD = '';
    monthlyList.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.revenue);
      if (i === 0) pathD += `M ${x} ${y}`;
      else pathD += ` L ${x} ${y}`;
    });

    // Construct Area Path for gradient fill
    let areaD = pathD;
    if (monthlyList.length > 0) {
      const firstX = getX(0);
      const lastX = getX(monthlyList.length - 1);
      const baselineY = height - padding;
      areaD += ` L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
    }

    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={getY(maxRevenue / 2)} x2={width - padding} y2={getY(maxRevenue / 2)} stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1={padding} y1={getY(maxRevenue)} x2={width - padding} y2={getY(maxRevenue)} stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Fill Area */}
          {monthlyList.length > 1 && (
            <path d={areaD} fill="url(#chartGradient)" />
          )}

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {monthlyList.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.revenue)} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <text x={getX(i)} y={height - 15} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="600">
                {d.month}
              </text>
              <text x={getX(i)} y={getY(d.revenue) - 10} textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="700">
                {formatINR(d.revenue)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderProductBarChart = () => {
    if (!bestSellers.length) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No product sales recorded yet.</p>;

    const maxSold = bestSellers[0]?.sold || 1;
    const width = 500;
    const barHeight = 28;
    const gap = 12;
    const height = bestSellers.length * (barHeight + gap) + 20;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: 'transparent' }}>
        {bestSellers.map((item, idx) => {
          const ratioWidth = maxSold ? (item.sold / maxSold) * (width - 200) : 0;
          const y = 10 + idx * (barHeight + gap);
          
          return (
            <g key={item.id}>
              {/* Product Label */}
              <text x="10" y={y + 18} style={{ fontSize: '11px', fontWeight: 700, fill: 'var(--text-main)' }}>
                #{idx + 1}
              </text>
              <text x="32" y={y + 18} style={{ fontSize: '11px', fontWeight: 600, fill: 'var(--text-muted)' }}>
                {item.name.length > 20 ? item.name.slice(0, 20) + '...' : item.name}
              </text>
              
              {/* Background Bar */}
              <rect x="160" y={y} width={width - 240} height={barHeight} rx="6" fill="var(--bg-app)" stroke="var(--border-color)" strokeWidth="1" />
              
              {/* Active Bar */}
              <rect 
                x="160" 
                y={y} 
                width={ratioWidth} 
                height={barHeight} 
                rx="6" 
                fill="var(--accent-color)" 
                style={{ transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} 
              />
              
              {/* Units indicator */}
              <text x={170 + ratioWidth} y={y + 18} style={{ fontSize: '11px', fontWeight: 800, fill: 'var(--accent-color)' }}>
                {item.sold} units
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderCategoryPieChart = () => {
    if (!categoryBreakdown.length) return <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No category purchase events parsed.</p>;

    const totalRevenue = categoryBreakdown.reduce((acc, curr) => acc + curr.revenue, 0);
    let accumulatedPercent = 0;

    const colors = ['var(--accent-color)', '#10b981', '#f59e0b', '#06b6d4'];

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '2rem', flexWrap: 'wrap', padding: '1.5rem 0' }}>
        {/* SVG Donut */}
        <div style={{ width: '180px', height: '180px', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-color)" strokeWidth="3" />
            
            {categoryBreakdown.map((cat, idx) => {
              const ratio = totalRevenue ? (cat.revenue / totalRevenue) * 100 : 0;
              const strokeDash = `${ratio} ${100 - ratio}`;
              const offset = 100 - accumulatedPercent;
              accumulatedPercent += ratio;
              
              return (
                <circle
                  key={idx}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="4"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out', cursor: 'pointer' }}
                  title={`${cat.category}: ${ratio.toFixed(1)}%`}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>Total Sales</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{formatINR(totalRevenue).replace('₹', '')}</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '150px' }}>
          {categoryBreakdown.map((cat, idx) => {
            const ratio = totalRevenue ? (cat.revenue / totalRevenue) * 100 : 0;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '30%', backgroundColor: colors[idx % colors.length], display: 'inline-block' }} />
                <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-main)' }}>
                  {cat.category}: <strong style={{ color: 'var(--accent-color)' }}>{ratio.toFixed(1)}%</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // Safe variables for data arrays
  const bestSellers = performanceData?.bestSellers || [];
  const leastSellers = performanceData?.leastSellers || [];
  const categoryBreakdown = performanceData?.categoryBreakdown || [];

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

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'sales' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Sales & Revenue Trends
          {activeTab === 'sales' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'products' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Product Volume Rankings
          {activeTab === 'products' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: activeTab === 'categories' ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.8rem',
            position: 'relative'
          }}
        >
          Category breakdown
          {activeTab === 'categories' && (
            <div style={{ position: 'absolute', bottom: '-0.9rem', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
          )}
        </button>
      </div>

      {activeTab === 'sales' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>
          {/* Sales Monthly Line Chart */}
          <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header-flex">
              <div className="card-title">Month-on-Month Revenue Trends</div>
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={fetchAnalyticsData}>
                <RefreshCw size={14} style={{ marginRight: '0.3rem' }} /> Refresh Data
              </button>
            </div>
            {renderMonthlyChart()}
          </div>

          {/* Daily Table Lists */}
          <div className="dashboard-card">
            <div className="card-header-flex">
              <div className="card-title">Daily Sales Records (Current Month)</div>
            </div>
            
            <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {!salesData?.dailySales?.length ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions registered today.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Revenue</th>
                      <th>Orders Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.dailySales.map((d, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{d.day}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{formatINR(d.revenue)}</td>
                        <td>{d.orders} orders</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="stat-card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Month Revenue</span>
                <DollarSign size={20} style={{ color: 'var(--color-success)' }} />
              </div>
              <div className="stat-value" style={{ fontSize: '2.2rem' }}>
                {formatINR(salesData?.monthlySales?.reduce((acc, curr) => acc + curr.revenue, 0) || 0)}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Sum total value generated across the active calendar year.
              </p>
            </div>

            <div className="stat-card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Lifetime Transactions</span>
                <Activity size={20} style={{ color: 'var(--accent-color)' }} />
              </div>
              <div className="stat-value" style={{ fontSize: '2.2rem' }}>
                {salesData?.monthlySales?.reduce((acc, curr) => acc + curr.orders, 0) || 0}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Total checkout requests finalized in database records.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Best Sellers (Bar Chart) */}
          <div className="dashboard-card">
            <div className="card-header-flex">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} style={{ color: 'var(--accent-color)' }} />
                Skincare Sales Volume Ratio
              </div>
            </div>

            <div style={{ padding: '1rem 0' }}>
              {renderProductBarChart()}
            </div>
          </div>

          {/* Least Sellers */}
          <div className="dashboard-card">
            <div className="card-header-flex">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
                Least Selling Skincare (Cold Stock)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
              {!leastSellers.length ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No listings in catalogs.</p>
              ) : (
                leastSellers.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <span>
                      <strong style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>{idx+1}.</strong>
                      {item.name}
                    </span>
                    <span style={{
                      fontWeight: 700, 
                      color: item.sold === 0 ? 'var(--color-danger)' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      backgroundColor: item.sold === 0 ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                      padding: item.sold === 0 ? '0.1rem 0.4rem' : '0',
                      borderRadius: '4px'
                    }}>
                      {item.sold} Sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
          {/* Pie Chart Card */}
          <div className="dashboard-card">
            <div className="card-header-flex">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={20} style={{ color: 'var(--accent-color)' }} />
                Share Distribution (Revenue)
              </div>
            </div>
            {renderCategoryPieChart()}
          </div>

          {/* Detailed table view */}
          <div className="dashboard-card">
            <div className="card-header-flex">
              <div className="card-title">Category Breakdown Details</div>
            </div>

            {!categoryBreakdown.length ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No category purchase events parsed.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryBreakdown.map((cat, idx) => (
                      <tr key={idx}>
                        <td style={{ textTransform: 'capitalize', fontWeight: 650 }}>{cat.category}</td>
                        <td style={{ fontWeight: 600 }}>{cat.units_sold} Units</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{formatINR(cat.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
