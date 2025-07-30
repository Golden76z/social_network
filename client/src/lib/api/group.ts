/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './index';
import { groupRoutes } from '@/constants/routes';
import { 
  Group, 
  GroupMember, 
  GroupEvent, 
  CreateGroupRequest, 
  UpdateGroupRequest,
  CreateGroupPostRequest,
  UpdateGroupPostRequest,
  CreateGroupCommentRequest,
  UpdateGroupCommentRequest,
  CreateGroupEventRequest,
  UpdateGroupEventRequest,
//   InviteToGroupRequest,
  UpdateGroupMemberRequest,
  RSVPToEventRequest,
//   GroupRole,
  EventRsvp
} from '@/lib/types';

export const groupApi = {
  // ===== GROUP MANAGEMENT =====
  
  // GET /api/group - Get all groups (with pagination support)
  getAllGroups: (page?: number, limit?: number): Promise<Group[]> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Group[]>(`${groupRoutes.base}${query}`);
  },

  // GET /api/group/{id} - Get specific group by ID
  getGroupById: (groupId: string): Promise<Group> => {
    return apiClient.get<Group>(`${groupRoutes.base}/${groupId}`);
  },

  // POST /api/group - Create new group
  createGroup: (data: CreateGroupRequest): Promise<Group> => {
    return apiClient.post<Group>(groupRoutes.base, data);
  },

  // PUT /api/group/{id} - Update specific group
  updateGroup: (groupId: string, data: UpdateGroupRequest): Promise<Group> => {
    return apiClient.put<Group>(`${groupRoutes.base}/${groupId}`, data);
  },

  // DELETE /api/group/{id} - Delete specific group
  deleteGroup: (groupId: string): Promise<void> => {
    return apiClient.delete<void>(`${groupRoutes.base}/${groupId}`);
  },

  // ===== GROUP POSTS =====

  // GET /api/group/post - Get all posts for a group
  getGroupPosts: (groupId: string, page?: number, limit?: number): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('groupId', groupId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = `?${params.toString()}`;
    return apiClient.get<any[]>(`${groupRoutes.post}${query}`);
  },

  // GET /api/group/post/{id} - Get specific group post by ID
  getGroupPostById: (postId: string): Promise<any> => {
    return apiClient.get<any>(`${groupRoutes.post}/${postId}`);
  },

  // POST /api/group/post - Create new group post
  createGroupPost: (data: CreateGroupPostRequest): Promise<any> => {
    return apiClient.post<any>(groupRoutes.post, data);
  },

  // PUT /api/group/post/{id} - Update specific group post
  updateGroupPost: (postId: string, data: UpdateGroupPostRequest): Promise<any> => {
    return apiClient.put<any>(`${groupRoutes.post}/${postId}`, data);
  },

  // DELETE /api/group/post/{id} - Delete specific group post
  deleteGroupPost: (postId: string): Promise<void> => {
    return apiClient.delete<void>(`${groupRoutes.post}/${postId}`);
  },

  // ===== GROUP COMMENTS =====

  // GET /api/group/comment - Get comments for a group post
  getGroupComments: (postId: string, page?: number, limit?: number): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('postId', postId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = `?${params.toString()}`;
    return apiClient.get<any[]>(`${groupRoutes.comment}${query}`);
  },

  // GET /api/group/comment/{id} - Get specific group comment by ID
  getGroupCommentById: (commentId: string): Promise<any> => {
    return apiClient.get<any>(`${groupRoutes.comment}/${commentId}`);
  },

  // POST /api/group/comment - Create new group comment
  createGroupComment: (data: CreateGroupCommentRequest): Promise<any> => {
    return apiClient.post<any>(groupRoutes.comment, data);
  },

  // PUT /api/group/comment/{id} - Update specific group comment
  updateGroupComment: (commentId: string, data: UpdateGroupCommentRequest): Promise<any> => {
    return apiClient.put<any>(`${groupRoutes.comment}/${commentId}`, data);
  },

  // DELETE /api/group/comment/{id} - Delete specific group comment
  deleteGroupComment: (commentId: string): Promise<void> => {
    return apiClient.delete<void>(`${groupRoutes.comment}/${commentId}`);
  },

  // ===== GROUP EVENTS =====

  // GET /api/group/event - Get all events for a group
  getGroupEvents: (groupId: string, page?: number, limit?: number): Promise<GroupEvent[]> => {
    const params = new URLSearchParams();
    params.append('groupId', groupId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = `?${params.toString()}`;
    return apiClient.get<GroupEvent[]>(`${groupRoutes.event}${query}`);
  },

  // GET /api/group/event/{id} - Get specific group event by ID
  getGroupEventById: (eventId: string): Promise<GroupEvent> => {
    return apiClient.get<GroupEvent>(`${groupRoutes.event}/${eventId}`);
  },

  // POST /api/group/event - Create new group event
  createGroupEvent: (data: CreateGroupEventRequest): Promise<GroupEvent> => {
    return apiClient.post<GroupEvent>(groupRoutes.event, data);
  },

  // PUT /api/group/event/{id} - Update specific group event
  updateGroupEvent: (eventId: string, data: UpdateGroupEventRequest): Promise<GroupEvent> => {
    return apiClient.put<GroupEvent>(`${groupRoutes.event}/${eventId}`, data);
  },

  // DELETE /api/group/event/{id} - Delete specific group event
  deleteGroupEvent: (eventId: string): Promise<void> => {
    return apiClient.delete<void>(`${groupRoutes.event}/${eventId}`);
  },

  // ===== GROUP MEMBERSHIP =====

  // GET /api/group/members - Get all members of a group
  getGroupMembers: (groupId: string, page?: number, limit?: number): Promise<GroupMember[]> => {
    const params = new URLSearchParams();
    params.append('groupId', groupId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = `?${params.toString()}`;
    return apiClient.get<GroupMember[]>(`${groupRoutes.members}${query}`);
  },

  // POST /api/group/member - Join a group or add member
  joinGroup: (groupId: string): Promise<GroupMember> => {
    return apiClient.post<GroupMember>(groupRoutes.member, { groupId });
  },

  // PUT /api/group/member - Update member role
  updateGroupMember: (data: UpdateGroupMemberRequest): Promise<GroupMember> => {
    return apiClient.put<GroupMember>(groupRoutes.member, data);
  },

  // DELETE /api/group/member - Leave group or remove member
  leaveGroup: (groupId: string, userId?: string): Promise<void> => {
    const params = new URLSearchParams();
    params.append('groupId', groupId);
    if (userId) params.append('userId', userId);
    return apiClient.delete<void>(`${groupRoutes.member}?${params.toString()}`);
  },

  // ===== GROUP INVITATIONS =====

  // GET /api/group/invitation - Get group invitations
//   getGroupInvitations: (groupId?: string, userId?: string): Promise<any[]> => {
//     const params = new URLSearchParams();
//     if (groupId) params.append('groupId', groupId);
//     if (userId) params.append('userId', userId);
//     const query = params.toString() ? `?${params.toString()}` : '';
//     return apiClient.get<any[]>(`${groupRoutes.invitations}${query}`);
//   },

//   // POST /api/group/invitation - Send group invitation
//   sendGroupInvitation: (data: InviteToGroupRequest): Promise<any> => {
//     return apiClient.post<any>(groupRoutes.invitations, data);
//   },

//   // PUT /api/group/invitation/{id} - Update invitation status (accept/decline)
//   updateGroupInvitation: (invitationId: string, status: 'accepted' | 'declined'): Promise<any> => {
//     return apiClient.put<any>(`${groupRoutes.invitations}/${invitationId}`, { status });
//   },

//   // DELETE /api/group/invitation/{id} - Cancel group invitation
//   cancelGroupInvitation: (invitationId: string): Promise<void> => {
//     return apiClient.delete<void>(`${groupRoutes.invitations}/${invitationId}`);
//   },

  // ===== EVENT RSVP =====

  // GET /api/group/event/rsvp - Get RSVPs for an event
  getEventRSVPs: (eventId: string): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('eventId', eventId);
    return apiClient.get<any[]>(`${groupRoutes.eventRsvp}?${params.toString()}`);
  },

  // POST /api/group/event/rsvp - RSVP to an event
  rsvpToEvent: (data: RSVPToEventRequest): Promise<any> => {
    return apiClient.post<any>(groupRoutes.eventRsvp, data);
  },

  // PUT /api/group/event/rsvp/{id} - Update RSVP status
  updateEventRSVP: (rsvpId: string, status: EventRsvp): Promise<any> => {
    return apiClient.put<any>(`${groupRoutes.eventRsvp}/${rsvpId}`, { status });
  },

  // DELETE /api/group/event/rsvp/{id} - Cancel RSVP
  cancelEventRSVP: (rsvpId: string): Promise<void> => {
    return apiClient.delete<void>(`${groupRoutes.eventRsvp}/${rsvpId}`);
  },

  // ===== ADDITIONAL HELPER METHODS =====

  // Get groups user is a member of
  getUserGroups: (userId?: string, page?: number, limit?: number): Promise<Group[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Group[]>(`${groupRoutes.base}/user${query}`);
  },

  // Get public groups
  getPublicGroups: (page?: number, limit?: number): Promise<Group[]> => {
    const params = new URLSearchParams();
    params.append('isPrivate', 'false');
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = `?${params.toString()}`;
    return apiClient.get<Group[]>(`${groupRoutes.base}${query}`);
  },

  // Search groups
  searchGroups: (query: string, page?: number, limit?: number): Promise<Group[]> => {
    const params = new URLSearchParams();
    params.append('search', query);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const queryString = `?${params.toString()}`;
    return apiClient.get<Group[]>(`${groupRoutes.base}/search${queryString}`);
  },
};