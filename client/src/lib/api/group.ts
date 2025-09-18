import { groupRoutes } from '@/constants/routes';
import { apiClient } from '../api';
import {
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupResponse,
  CreateGroupPostRequest,
  UpdateGroupPostRequest,
  GroupPost,
  CreateGroupCommentRequest,
  UpdateGroupCommentRequest,
  CreateGroupEventRequest,
  UpdateGroupEventRequest,
  UpdateGroupMemberRequest,
  LeaveGroupRequest,
  RSVPToEventRequest,
} from '../types';

export const groupApi = {
  // ===== GROUPS =====

  getAllGroups: (page?: number, limit?: number): Promise<GroupResponse[]> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${groupRoutes.base}${query}`);
  },

  getUserGroups: (): Promise<GroupResponse[]> => {
    return apiClient.get(`${groupRoutes.base}/user/mine`);
  },

  getGroupById: (groupId: string | number): Promise<GroupResponse> => {
    return apiClient.get(`${groupRoutes.base}/${groupId}`);
  },

  createGroup: (data: CreateGroupRequest): Promise<GroupResponse> => {
    return apiClient.post(groupRoutes.base, data);
  },

  updateGroup: (groupId: string | number, data: UpdateGroupRequest): Promise<GroupResponse> => {
    return apiClient.put(`${groupRoutes.base}/${groupId}`, data);
  },

  deleteGroup: (groupId: string | number): Promise<void> => {
    return apiClient.delete(`${groupRoutes.base}/${groupId}`);
  },

  // ===== GROUP POSTS =====

  getGroupPosts: (groupId: string | number, offset?: number): Promise<GroupPost[]> => {
    const params = new URLSearchParams();
    params.append('groupId', groupId.toString());
    // Always provide offset parameter (default to 0 if not specified)
    params.append('offset', (offset ?? 0).toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/group/post${query}`);
  },

  getGroupPostById: (postId: string | number): Promise<GroupPost> => {
    return apiClient.get(`/api/group/post/${postId}`);
  },

  createGroupPost: (data: CreateGroupPostRequest): Promise<GroupPost> => {
    return apiClient.post('/api/group/post', data);
  },

  updateGroupPost: (postId: string | number, data: UpdateGroupPostRequest): Promise<GroupPost> => {
    return apiClient.put(`/api/group/post/${postId}`, data);
  },

  deleteGroupPost: (postId: string | number): Promise<void> => {
    return apiClient.delete(`/api/group/post/${postId}`);
  },

  // ===== GROUP COMMENTS =====

  getGroupComments: (postId: string | number) => {
    return apiClient.get(`/api/group/comment?postId=${postId}`);
  },

  getGroupCommentById: (commentId: string | number) => {
    return apiClient.get(`/api/group/comment/${commentId}`);
  },

  createGroupComment: (data: CreateGroupCommentRequest) => {
    return apiClient.post('/api/group/comment', data);
  },

  updateGroupComment: (commentId: string | number, data: UpdateGroupCommentRequest) => {
    return apiClient.put(`/api/group/comment/${commentId}`, data);
  },

  deleteGroupComment: (commentId: string | number): Promise<void> => {
    return apiClient.delete(`/api/group/comment/${commentId}`);
  },

  // ===== GROUP EVENTS =====

  getGroupEvents: (groupId: string | number) => {
    return apiClient.get(`/api/group/event?groupId=${groupId}`);
  },

  getGroupEventById: (eventId: string | number) => {
    return apiClient.get(`/api/group/event/${eventId}`);
  },

  createGroupEvent: (data: CreateGroupEventRequest) => {
    return apiClient.post('/api/group/event', data);
  },

  updateGroupEvent: (eventId: string | number, data: UpdateGroupEventRequest) => {
    return apiClient.put(`/api/group/event/${eventId}`, data);
  },

  deleteGroupEvent: (eventId: string | number): Promise<void> => {
    return apiClient.delete(`/api/group/event/${eventId}`);
  },

  // ===== GROUP MEMBERSHIP =====

  joinGroup: (groupId: string | number) => {
    return apiClient.post('/api/group/member', { group_id: Number(groupId) });
  },

  leaveGroup: (data: LeaveGroupRequest): Promise<void> => {
    return apiClient.delete('/api/group/member', {
      body: JSON.stringify(data),
    });
  },

  getGroupMembers: async (groupId: string | number, offset?: number) => {
    const params = new URLSearchParams();
    params.append('id', groupId.toString());
    // Always provide offset parameter (default to 0 if not specified)
    params.append('offset', (offset ?? 0).toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/api/group/members${query}`) as any;
    // Server returns { response: string, members: array }
    return response.members || [];
  },

  updateGroupMember: (data: UpdateGroupMemberRequest) => {
    return apiClient.put('/api/group/member', data);
  },

  // ===== GROUP REQUESTS =====

  createGroupRequest: (groupId: string | number) => {
    return apiClient.post('/api/group/request', { group_id: Number(groupId) });
  },

  getGroupRequests: (groupId: string | number, status?: string) => {
    const params = new URLSearchParams();
    params.append('group_id', groupId.toString());
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/group/request${query}`);
  },

  getUserPendingRequests: () => {
    return apiClient.get('/api/group/request/user');
  },

  approveGroupRequest: (requestId: string | number) => {
    return apiClient.put('/api/group/request', { id: Number(requestId), status: 'accepted' });
  },

  declineGroupRequest: (requestId: string | number) => {
    return apiClient.put('/api/group/request', { id: Number(requestId), status: 'declined' });
  },

  cancelGroupRequest: (requestId: string | number): Promise<void> => {
    return apiClient.delete('/api/group/request', {
      body: JSON.stringify({ id: Number(requestId) }),
    });
  },

  // ===== RSVP =====

  getEventRSVPs: (eventId: string | number) => {
    return apiClient.get(`/api/group/event/rsvp?eventId=${eventId}`);
  },

  rsvpToEvent: (data: RSVPToEventRequest) => {
    return apiClient.post('/api/group/event/rsvp', data);
  },

  updateEventRSVP: (rsvpId: string | number, status: string) => {
    return apiClient.put(`/api/group/event/rsvp/${rsvpId}`, { status });
  },

  cancelEventRSVP: (rsvpId: string | number): Promise<void> => {
    return apiClient.delete(`/api/group/event/rsvp/${rsvpId}`);
  },

  // ===== NOTIFICATIONS =====

  getNotifications: (unreadOnly?: boolean) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread_only', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/user/notifications${query}`);
  },

  markNotificationRead: (notificationId: string | number) => {
    return apiClient.put('/api/user/notifications', { id: Number(notificationId), is_read: true });
  },

  deleteNotification: (notificationId: string | number): Promise<void> => {
    return apiClient.delete('/api/user/notifications', {
      body: JSON.stringify({ id: Number(notificationId) }),
    });
  },
};