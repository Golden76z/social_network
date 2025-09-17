// (No imports required)

// ===== GROUP =====
export interface CreateGroupRequest {
  title: string;
  avatar?: string;
  bio?: string;
}

export interface UpdateGroupRequest {
  id?: number;
  title?: string;
  avatar?: string;
  bio?: string;
}

export interface DeleteGroupRequest {
  id: number;
}

export interface GroupResponse {
  id: number;
  title: string;
  avatar?: string;
  bio?: string;
  creator_id: number;
  created_at: string;
  updated_at?: string;
}

// ===== GROUP POST =====
export interface CreateGroupPostRequest {
  group_id: number;
  title: string;
  body: string;
}

export interface GroupPost {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  visibility: string;
  images: string[];
  likes: number;
  dislikes: number;
  user_liked: boolean;
  user_disliked: boolean;
}

export interface UpdateGroupPostRequest {
  id?: number;
  title?: string;
  body?: string;
}

export interface DeleteGroupPostRequest {
  id: number;
}

// ===== GROUP COMMENT =====
export interface CreateGroupCommentRequest {
  group_post_id: number;
  body: string;
}

export interface UpdateGroupCommentRequest {
  id?: number;
  body?: string;
}

export interface DeleteGroupCommentRequest {
  id: number;
}

// ===== GROUP EVENT =====
export interface CreateGroupEventRequest {
  group_id: number;
  title: string;
  description: string;
  event_date_time: string;
}

export interface UpdateGroupEventRequest {
  id?: number;
  title?: string;
  description?: string;
  event_date_time?: string;
}

export interface DeleteGroupEventRequest {
  id: number;
}

// ===== GROUP MEMBER / INVITATION =====
export interface InviteToGroupRequest {
  group_id: number;
  user_id: number;
}

export interface LeaveGroupRequest {
  group_id: number;
  user_id: number;
}

export interface UpdateGroupMemberRequest {
  groupID: number;
  memberID: number;
  role: string;
}

// ===== RSVP =====
export interface RSVPToEventRequest {
  event_id: number;
  user_id: number;
  status: string; // "come", "interested", "not_come"
}

export interface CancelRSVPRequest {
  event_id: number;
  user_id: number;
  status: string;
}