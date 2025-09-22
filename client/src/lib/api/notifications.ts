import { Notification, CreateNotificationRequest, UpdateNotificationRequest } from '@/lib/types';
import { apiClient } from './index';

export const notificationApi = {
  async getUserNotifications(
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(unreadOnly && { unread_only: 'true' }),
    });

    return apiClient.get(`/api/user/notifications?${params}`);
  },

  async createNotification(data: CreateNotificationRequest): Promise<void> {
    return apiClient.post('/api/user/notifications', data);
  },

  async updateNotification(id: number, isRead: boolean): Promise<void> {
    return apiClient.put('/api/user/notifications', { id, is_read: isRead });
  },

  async deleteNotification(id: number): Promise<void> {
    return apiClient.delete('/api/user/notifications', { id });
  },

  async markAsRead(id: number): Promise<void> {
    return this.updateNotification(id, true);
  },

  async markAsUnread(id: number): Promise<void> {
    return this.updateNotification(id, false);
  },

  async acceptNotification(id: number): Promise<void> {
    return apiClient.post('/api/user/notifications/accept', { notification_id: id });
  },

  async declineNotification(id: number): Promise<void> {
    return apiClient.post('/api/user/notifications/decline', { notification_id: id });
  }
};
