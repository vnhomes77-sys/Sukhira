import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Staff from './pages/Staff';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Protected Administrative Dashboard Layout Wrapper */}
          <Route
            path="/"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {/* Dashboard Homepage - Available to all logged-in staff */}
            <Route index element={<Dashboard />} />

            {/* Skincare Catalog CRUD Manager - Owner, Manager, Support */}
            <Route
              path="products"
              element={
                <AdminRoute allowedRoles={['owner', 'manager', 'support']}>
                  <Products />
                </AdminRoute>
              }
            />

            {/* Orders Fulfillment logs - Owner, Manager, Staff, Support */}
            <Route
              path="orders"
              element={
                <AdminRoute allowedRoles={['owner', 'manager', 'order_staff', 'support']}>
                  <Orders />
                </AdminRoute>
              }
            />

            {/* Inventory Direct stock edits - Owner, Manager, Staff */}
            <Route
              path="inventory"
              element={
                <AdminRoute allowedRoles={['owner', 'manager', 'order_staff']}>
                  <Inventory />
                </AdminRoute>
              }
            />

            {/* Customer order histories and registries - Owner, Manager, Support */}
            <Route
              path="customers"
              element={
                <AdminRoute allowedRoles={['owner', 'manager', 'support']}>
                  <Customers />
                </AdminRoute>
              }
            />

            {/* Sales performance analytics reports - Owner, Manager */}
            <Route
              path="analytics"
              element={
                <AdminRoute allowedRoles={['owner', 'manager']}>
                  <Analytics />
                </AdminRoute>
              }
            />

            {/* Internal Staff accounts assignment manager - Owner only */}
            <Route
              path="staff"
              element={
                <AdminRoute allowedRoles={['owner']}>
                  <Staff />
                </AdminRoute>
              }
            />

            {/* Store policies FAQ configurations - Owner only */}
            <Route
              path="settings"
              element={
                <AdminRoute allowedRoles={['owner']}>
                  <Settings />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all navigation fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
