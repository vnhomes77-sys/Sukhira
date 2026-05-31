import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Database,
  Users,
  BarChart3,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
  Sparkles
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  // Define navigation items with their icons, path, and roles required
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard size={20} />,
      roles: ['owner', 'manager', 'order_staff', 'support']
    },
    {
      name: 'Products',
      path: '/products',
      icon: <Package size={20} />,
      roles: ['owner', 'manager', 'support']
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: <ShoppingCart size={20} />,
      roles: ['owner', 'manager', 'order_staff', 'support']
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: <Database size={20} />,
      roles: ['owner', 'manager', 'order_staff']
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: <Users size={20} />,
      roles: ['owner', 'manager', 'support']
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChart3 size={20} />,
      roles: ['owner', 'manager']
    },
    {
      name: 'Staff Management',
      path: '/staff',
      icon: <UserCheck size={20} />,
      roles: ['owner']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <SettingsIcon size={20} />,
      roles: ['owner']
    }
  ];

  // Helper to format role names for the badge
  const formatRole = (role) => {
    if (!role) return '';
    return role.replace('_', ' ');
  };

  // Helper to determine the CSS class for user role
  const getRoleClass = (role) => {
    switch (role) {
      case 'owner': return 'role-owner';
      case 'manager': return 'role-manager';
      case 'order_staff': return 'role-staff';
      case 'support': return 'role-support';
      default: return 'badge-muted';
    }
  };

  return (
    <div className={`admin-container theme-${user?.role || 'owner'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <Sparkles className="sidebar-logo-icon" size={24} />
          <span>SUKHIRA</span>
        </div>

        <nav className="sidebar-menu">
          {navItems
            .filter((item) => hasRole(item.roles))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogoutClick}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-title-block">
            <h1>Sukhira Skincare Admin Control Center</h1>
          </div>

          <div className="header-user-block">
            <div className={`header-role-badge ${getRoleClass(user?.role)}`}>
              {formatRole(user?.role)}
            </div>
            <div className="user-profile-trigger">
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="user-name">{user?.name}</div>
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
