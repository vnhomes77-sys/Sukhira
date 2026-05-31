import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an uncaught rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--bg-card, #ffffff) 0%, var(--bg-app, #f8fafc) 100%)',
          padding: '2rem',
          fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
          color: 'var(--text-main, #0f172a)'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              marginBottom: '1.5rem'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginBottom: '0.8rem',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-title, sans-serif)'
            }}>
              Oops, something went wrong
            </h1>

            <p style={{
              color: 'var(--text-muted, #64748b)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>
              An unexpected rendering error occurred. We have intercepted the crash to protect your session.
            </p>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              textAlign: 'left',
              marginBottom: '2rem',
              maxHeight: '120px',
              overflowY: 'auto',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#334155'
            }}>
              <strong>Error Trace:</strong> {this.state.error?.toString() || 'Unknown React crash'}
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent-color, #0f172a)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  fontSize: '0.9rem'
                }}
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <Home size={16} />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
