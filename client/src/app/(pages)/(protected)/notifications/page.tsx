'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Notification, NotificationData, NotificationType } from '@/lib/types';
import { notificationApi } from '@/lib/api/notifications';
import { Avatar } from '@/components/layout/Avatar';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onAccept, onDecline }: NotificationItemProps) {
  const router = useRouter();
  const [data, setData] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const parsedData = JSON.parse(notification.data) as NotificationData;
      setData(parsedData);
    } catch (error) {
      console.error('Error parsing notification data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [notification.data]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request':
        return '👤';
      case 'follow_accepted':
        return '✅';
      case 'group_invite':
        return '👥';
      case 'group_request':
      case 'group_join_request':
        return '📝';
      case 'group_event':
        return '📅';
      case 'post_like':
        return '❤️';
      case 'post_comment':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow_request':
        return 'bg-blue-500';
      case 'follow_accepted':
        return 'bg-green-500';
      case 'group_invite':
        return 'bg-purple-500';
      case 'group_request':
      case 'group_join_request':
        return 'bg-orange-500';
      case 'group_event':
        return 'bg-indigo-500';
      case 'post_like':
        return 'bg-red-500';
      case 'post_comment':
        return 'bg-teal-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get user info from notification data
  const getUserInfo = () => {
    if (!data) return { id: null, nickname: '', avatar: '' };
    
    switch (data.type) {
      case 'follow_request':
        return {
          id: data.requester_id,
          nickname: data.requester_nickname,
          avatar: data.requester_avatar || ''
        };
      case 'follow_accepted':
        return {
          id: data.target_id,
          nickname: data.target_nickname,
          avatar: data.target_avatar || ''
        };
      case 'group_invite':
        return {
          id: data.inviter_id,
          nickname: data.inviter_nickname,
          avatar: data.inviter_avatar || ''
        };
      case 'group_request':
      case 'group_join_request':
        return {
          id: data.requester_id,
          nickname: data.requester_nickname,
          avatar: data.requester_avatar || ''
        };
      case 'group_event':
        return {
          id: data.creator_id,
          nickname: data.creator_nickname,
          avatar: data.creator_avatar || ''
        };
      case 'post_like':
        return {
          id: data.liker_id,
          nickname: data.liker_nickname,
          avatar: data.liker_avatar || ''
        };
      case 'post_comment':
        return {
          id: data.commenter_id,
          nickname: data.commenter_nickname,
          avatar: data.commenter_avatar || ''
        };
      default:
        return { id: null, nickname: '', avatar: '' };
    }
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    const userInfo = getUserInfo();
    if (userInfo.id) {
      router.push(`/profile?userId=${userInfo.id}`);
    }
  };

  // Handle group navigation
  const handleGroupClick = () => {
    if (!data) return;
    
    let groupId: number | null = null;
    
    switch (data.type) {
      case 'group_invite':
        groupId = data.group_id;
        break;
      case 'group_request':
      case 'group_join_request':
        groupId = data.group_id;
        break;
      case 'group_event':
        groupId = data.group_id;
        break;
    }
    
    if (groupId) {
      router.push(`/groups/${groupId}/info`);
    }
  };

  const renderNotificationContent = () => {
    if (isLoading || !data) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-muted/50 rounded animate-pulse w-1/4"></div>
          </div>
        </div>
      );
    }

    switch (data.type) {
      case 'follow_request':
        const requesterInfo = getUserInfo();
        return (
          <div className="flex items-center gap-3">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <Avatar
                src={requesterInfo.avatar}
                alt={requesterInfo.nickname}
                fallback={requesterInfo.nickname.charAt(0).toUpperCase()}
                size="md"
                className="border-2 border-border"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {data.expired ? (
                  <span className="text-muted-foreground">{data.message || 'This request has been cancelled'}</span>
                ) : (
                  <>
                    <span 
                      className="font-semibold text-primary cursor-pointer hover:underline"
                      onClick={handleProfileClick}
                    >
                      {data.requester_nickname}
                    </span> wants to follow you
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!data.expired && (
                <>
                  <button 
                    className="px-3 py-1.5 bg-primary/80 text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => onAccept(notification.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className="px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-accent transition-all duration-200"
                    onClick={() => onDecline(notification.id)}
                  >
                    Decline
                  </button>
                </>
              )}
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive/80 hover:bg-destructive/5 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
            {!notification.is_read && <div className="w-2 h-2 bg-primary/60 rounded-full"></div>}
          </div>
        );

      case 'follow_accepted':
        const targetInfo = getUserInfo();
        return (
          <div className="flex items-center gap-3">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <Avatar
                src={targetInfo.avatar}
                alt={targetInfo.nickname}
                fallback={targetInfo.nickname.charAt(0).toUpperCase()}
                size="md"
                className="border-2 border-border"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  {data.target_nickname}
                </span> accepted your follow request
              </p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive/80 hover:bg-destructive/5 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
            {!notification.is_read && <div className="w-2 h-2 bg-primary/60 rounded-full"></div>}
          </div>
        );

      case 'group_invite':
        const inviterInfo = getUserInfo();
        return (
          <div className="flex items-center gap-3">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <Avatar
                src={inviterInfo.avatar}
                alt={inviterInfo.nickname}
                fallback={inviterInfo.nickname.charAt(0).toUpperCase()}
                size="md"
                className="border-2 border-border"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  {data.inviter_nickname}
                </span> invited you to join <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleGroupClick}
                >
                  {data.group_name}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 bg-primary/80 text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => onAccept(notification.id)}
              >
                Accept
              </button>
              <button 
                className="px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-accent transition-all duration-200"
                onClick={() => onDecline(notification.id)}
              >
                Decline
              </button>
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive/80 hover:bg-destructive/5 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
            {!notification.is_read && <div className="w-2 h-2 bg-primary/60 rounded-full"></div>}
          </div>
        );

      case 'group_request':
      case 'group_join_request':
        const requesterInfo2 = getUserInfo();
        return (
          <div className="flex items-center gap-3">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <Avatar
                src={requesterInfo2.avatar}
                alt={requesterInfo2.nickname}
                fallback={requesterInfo2.nickname.charAt(0).toUpperCase()}
                size="md"
                className="border-2 border-border"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  {data.requester_nickname || 'Someone'}
                </span> wants to join <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleGroupClick}
                >
                  {data.group_name || 'a group'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 bg-primary/80 text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => onAccept(notification.id)}
              >
                Accept
              </button>
              <button 
                className="px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-accent transition-all duration-200"
                onClick={() => onDecline(notification.id)}
              >
                Decline
              </button>
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive/80 hover:bg-destructive/5 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
            {!notification.is_read && <div className="w-2 h-2 bg-primary/60 rounded-full"></div>}
          </div>
        );

      case 'group_event':
        const creatorInfo = getUserInfo();
        return (
          <div className="flex items-center gap-3">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <Avatar
                src={creatorInfo.avatar}
                alt={creatorInfo.nickname}
                fallback={creatorInfo.nickname.charAt(0).toUpperCase()}
                size="md"
                className="border-2 border-border"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  {data.creator_nickname}
                </span> created a new event <span className="font-semibold text-primary">"{data.event_title}"</span> in <span 
                  className="font-semibold text-primary cursor-pointer hover:underline"
                  onClick={handleGroupClick}
                >
                  {data.group_name}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 bg-primary/80 text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => {/* Handle view event */}}
              >
                View Event
              </button>
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive/80 hover:bg-destructive/5 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
            {!notification.is_read && <div className="w-2 h-2 bg-primary/60 rounded-full"></div>}
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${getNotificationColor(data.type)} flex items-center justify-center text-white text-lg`}>
              {getNotificationIcon(data.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">New notification</p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!notification.is_read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive/80 hover:bg-destructive/5 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
            {!notification.is_read && <div className="w-2 h-2 bg-primary/60 rounded-full"></div>}
          </div>
        );
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors ${!notification.is_read ? 'ring-1 ring-primary/20' : ''}`}>
      {renderNotificationContent()}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationApi.getUserNotifications(50, 0, filter === 'unread');
      setNotifications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        (prev || []).map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => (prev || []).filter(notif => notif.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleAccept = async (id: number) => {
    setActionLoading(true);
    try {
      await notificationApi.acceptNotification(id);
      // Remove the notification from the list
      setNotifications(prev => (prev || []).filter(notif => notif.id !== id));
    } catch (err: any) {
      console.error('Error accepting notification:', err);
      if (err.message?.includes('no longer exists') || err.message?.includes('no longer pending')) {
        setModalMessage('This request is no longer available. It may have been cancelled or already processed.');
        setModalOpen(true);
        // Remove the notification from the list since it's no longer valid
        setNotifications(prev => (prev || []).filter(notif => notif.id !== id));
      } else {
        setError('Failed to accept request');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (id: number) => {
    setActionLoading(true);
    try {
      await notificationApi.declineNotification(id);
      // Remove the notification from the list
      setNotifications(prev => (prev || []).filter(notif => notif.id !== id));
    } catch (err: any) {
      console.error('Error declining notification:', err);
      if (err.message?.includes('no longer exists') || err.message?.includes('no longer pending')) {
        setModalMessage('This request is no longer available. It may have been cancelled or already processed.');
        setModalOpen(true);
        // Remove the notification from the list since it's no longer valid
        setNotifications(prev => (prev || []).filter(notif => notif.id !== id));
      } else {
        setError('Failed to decline request');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleMarkAllAsRead = async () => {
    if (!notifications || unreadCount === 0) return;
    
    try {
      setActionLoading(true);
      const unreadNotifications = notifications.filter(n => !n.is_read);
      const promises = unreadNotifications.map(notif => notificationApi.markAsRead(notif.id));
      await Promise.all(promises);
      
      // Update local state
      setNotifications(prev => 
        (prev || []).map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!notifications || notifications.length === 0) return;
    
    try {
      setActionLoading(true);
      const promises = notifications.map(notif => notificationApi.deleteNotification(notif.id));
      await Promise.all(promises);
      
      // Clear local state
      setNotifications([]);
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
      setError('Failed to delete all notifications');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 pt-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
            {notifications && notifications.length > 0 && (
              <span className="ml-1 text-xs bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Bulk Actions */}
        {!loading && !error && notifications && notifications.length > 0 && (
          <div className="mt-4 flex gap-2 justify-center">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                ) : (
                  <span>✓</span>
                )}
                Mark All Read
              </button>
            )}
            <button
              onClick={handleDeleteAll}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
              ) : (
                <span>🗑️</span>
              )}
              Delete All
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={loadNotifications}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (!notifications || notifications.length === 0) && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-4xl">
            🔔
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">No notifications</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      )}

      {!loading && !error && notifications && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
        title="Request No Longer Available"
        message={modalMessage}
        confirmText="OK"
        cancelText=""
        variant="info"
        isLoading={actionLoading}
      />
    </div>
  );
}
