import { useState, useEffect } from 'react';
import { notificationApi } from '@/lib/api/notifications';
import { useAuth } from '@/context/AuthProvider';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      // Get only unread notifications to count them
      const notifications = await notificationApi.getUserNotifications(100, 0, true);
      setUnreadCount(notifications?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
