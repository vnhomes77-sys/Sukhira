import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Outfit, sans-serif',
        backgroundColor: '#0f172a',
        color: '#ffffff'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ fontWeight: '500', color: '#94a3b8' }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve the attempt location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role is not allowed, show access denied view
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Outfit, sans-serif',
        backgroundColor: '#f4f6f9',
        color: '#1e293b'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          color: '#ef4444'
        }}>
          🛡️
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '1.5rem' }}>
          Your role (<strong>{user.role}</strong>) does not have permission to access this page. Please contact the administrator.
        </p>
        <a href="/" style={{
          padding: '0.6rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontWeight: '600',
          borderRadius: '8px',
          textDecoration: 'none',
          boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
        }}>
          Back to Dashboard
        </a>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
