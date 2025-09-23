'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Heart, MessageCircle } from 'lucide-react';
import { useWebSocketContext } from '@/context/webSocketProvider';
import { useAuth } from '@/context/AuthProvider';

interface NotificationItem {
  id: string;
  type: 'post_like' | 'post_comment';
  content: string;
  timestamp: Date;
  data: {
    notification_type: string;
    post_id: number;
    liker_id?: number;
    commenter_id?: number;
    liker_nickname?: string;
    commenter_nickname?: string;
    liker_avatar?: string;
    commenter_avatar?: string;
  };
}

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lastMessage } = useWebSocketContext();
  const { user } = useAuth();

  // Handle websocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'notification' && lastMessage.data) {
      const data = lastMessage.data as any;
      if (data.notification_type === 'post_like' || data.notification_type === 'post_comment') {
        const newNotification: NotificationItem = {
          id: `${data.notification_type}_${data.post_id}_${Date.now()}`,
          type: data.notification_type,
          content: lastMessage.content || '',
          timestamp: new Date(),
          data: data,
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 most recent
        setUnreadCount(prev => prev + 1);
        
        // Auto-remove notification after 3 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }, 3000);
      }
    }
  }, [lastMessage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'post_comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read by removing from unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    // Could navigate to the post here if needed
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-border/50 hover:border-border bg-background/50 hover:bg-accent/50 backdrop-blur-sm transition-all duration-200 hover:shadow-sm group"
      >
        <Bell className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border/50 bg-popover/95 backdrop-blur-md shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
