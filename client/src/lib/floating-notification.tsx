"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationData {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'error' | 'success' | 'info', duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (
    message: string, 
    type: 'error' | 'success' | 'info' = 'error', 
    duration: number = 8000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: NotificationData = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  // Remove notification manually
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Floating Notifications Container */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              marginBottom: '12px',
              pointerEvents: 'auto',
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div
              style={{
                backgroundColor: notification.type === 'error' ? 'var(--card)' : 
                                notification.type === 'success' ? 'var(--muted)' : 'var(--background)',
                borderColor: notification.type === 'error' ? 'var(--border)' : 
                            notification.type === 'success' ? 'var(--border)' : 'var(--border)',
                borderLeft: notification.type === 'error' ? '4px solid var(--purple-600)' : 
                           notification.type === 'success' ? '4px solid var(--primary)' : 
                           '4px solid var(--ring)',
                color: 'var(--foreground)',
                borderTop: '1px solid',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderTopColor: 'var(--border)',
                borderRightColor: 'var(--border)',
                borderBottomColor: 'var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                maxWidth: '400px',
                minWidth: '300px',
                opacity: 1,
                transform: 'translateY(0)',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                {notification.type === 'error' && (
                  <div style={{
                    flexShrink: 0,
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'var(--purple-100)',
                    border: '2px solid var(--purple-600)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'var(--purple-600)', fontSize: '12px', fontWeight: 'bold' }}>!</span>
                  </div>
                )}
                {notification.type === 'success' && (
                  <div style={{
                    flexShrink: 0,
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'var(--purple-500)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'var(--purple-50)', fontSize: '12px' }}>✓</span>
                  </div>
                )}
                {notification.type === 'info' && (
                  <div style={{
                    flexShrink: 0,
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'var(--ring)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'var(--background)', fontSize: '12px' }}>i</span>
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontWeight: '500',
                    color: 'var(--foreground)',
                    fontSize: '14px',
                    lineHeight: '1.4',
                  }}>
                    {notification.message}
                  </p>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--muted-foreground)',
                    fontSize: '18px',
                    lineHeight: 1,
                  }}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
