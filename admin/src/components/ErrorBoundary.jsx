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
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#f8fafc'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              marginBottom: '1.5rem'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginBottom: '0.8rem',
              letterSpacing: '-0.02em'
            }}>
              Admin System Error
            </h1>

            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>
              An unexpected layout crash was intercepted. The administrator panel has been isolated safely.
            </p>

            <div style={{
              padding: '1rem',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              textAlign: 'left',
              marginBottom: '2rem',
              maxHeight: '120px',
              overflowY: 'auto',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#cbd5e1'
            }}>
              <strong>Error Trace:</strong> {this.state.error?.toString() || 'Unknown Admin crash'}
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
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                  fontSize: '0.9rem'
                }}
              >
                <RefreshCw size={16} />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid #475569',
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
