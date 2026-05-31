import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="toast-container">
        {notifications.map((notif) => (
          <div key={notif.id} className={`toast-notification toast-${notif.type}`}>
            <span className={`toast-icon-wrapper toast-icon-${notif.type}`}>
              {getIcon(notif.type)}
            </span>
            <span className="toast-message">{notif.message}</span>
            <button className="toast-close" onClick={() => removeNotification(notif.id)} aria-label="Close notification">
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
