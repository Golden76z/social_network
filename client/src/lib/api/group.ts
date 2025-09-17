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
    if (offset !== undefined) params.append('offset', offset.toString());
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

  updateGroupMember: (data: UpdateGroupMemberRequest) => {
    return apiClient.put('/api/group/member', data);
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
};