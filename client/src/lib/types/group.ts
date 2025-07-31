import { User } from './user';

export interface Group {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  membersCount: number;
  postsCount: number;
  coverImage?: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  user: User;
  role: GroupRole;
  joinedAt: string;
}

export interface CreateGroupRequest {
  title: string;
  bio: string;
  avatar?: string;
  isPrivate?: boolean;
}

export interface GroupEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  groupId: string;
  createdBy: string;
  attendeesCount: number;
  userRsvp?: EventRsvp;
}

// Add these types to your existing types file

// Group Post Types
export interface GroupPost {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  body: string;
  images?: string[];
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPostRequest {
  groupId: string;
  title: string;
  body: string;
  images?: File[];
}

export interface UpdateGroupPostRequest {
  title?: string;
  body?: string;
  images?: File[];
}

// Group Comment Types
export interface GroupComment {
  id: string;
  groupPostId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupCommentRequest {
  groupPostId: string;
  body: string;
}

export interface UpdateGroupCommentRequest {
  body: string;
}

// Group Event Types (extending the existing GroupEvent interface)
export interface CreateGroupEventRequest {
  groupId: string;
  title: string;
  description: string;
  date: string;
  location?: string;
}

export interface UpdateGroupEventRequest {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}

// Group Member Types (extending existing)
export interface InviteToGroupRequest {
  groupId: string;
  userId: string;
}

export interface UpdateGroupMemberRequest {
  groupId: string;
  memberId: string;
  role: GroupRole;
}

// Group Invitation Types
export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedUserId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

// RSVP Types
export interface EventRSVP {
  id: string;
  eventId: string;
  userId: string;
  status: EventRsvp;
  createdAt: string;
  updatedAt: string;
}

export interface RSVPToEventRequest {
  eventId: string;
  status: EventRsvp;
}

// Update the existing Group interface if needed
export interface UpdateGroupRequest {
  title?: string;
  bio?: string;
  avatar?: string;
}

export type GroupRole = 'owner' | 'admin' | 'member';
export type EventRsvp = 'going' | 'not_going' | 'maybe';