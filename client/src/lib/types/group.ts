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
  name: string;
  description: string;
  isPrivate?: boolean;
  coverImage?: File;
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

export type GroupRole = 'owner' | 'admin' | 'member';
export type EventRsvp = 'going' | 'not_going' | 'maybe';