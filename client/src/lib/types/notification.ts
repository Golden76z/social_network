export interface Notification {
  id: number;
  user_id: number;
  type: string;
  data: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: string;
  notif_id?: number;
  external_id?: string;
  data: string;
}

export interface UpdateNotificationRequest {
  id: number;
  type?: string;
  external_id?: string;
  is_read: boolean;
}

export interface DeleteNotificationRequest {
  id: number;
}

// Parsed notification data interfaces
export interface FollowRequestNotificationData {
  requester_id: number;
  requester_nickname: string;
  requester_avatar?: string;
  type: 'follow_request';
  expired?: boolean;
  message?: string;
}

export interface FollowAcceptedNotificationData {
  target_id: number;
  target_nickname: string;
  target_avatar?: string;
  type: 'follow_accepted';
}

export interface GroupInviteNotificationData {
  group_id: number;
  group_name: string;
  inviter_id: number;
  inviter_nickname: string;
  inviter_avatar?: string;
  type: 'group_invite';
}

export interface GroupRequestNotificationData {
  group_id: number;
  group_name: string;
  requester_id: number;
  requester_nickname: string;
  requester_avatar?: string;
  type: 'group_request' | 'group_join_request';
}

export interface GroupEventNotificationData {
  group_id: number;
  group_name: string;
  event_id: number;
  event_title: string;
  creator_id: number;
  creator_nickname: string;
  creator_avatar?: string;
  type: 'group_event';
}

export interface PostLikeNotificationData {
  post_id: number;
  liker_id: number;
  liker_nickname: string;
  liker_avatar?: string;
  type: 'post_like';
}

export interface PostCommentNotificationData {
  post_id: number;
  commenter_id: number;
  commenter_nickname: string;
  commenter_avatar?: string;
  type: 'post_comment';
}

// Union type for all notification data types
export type NotificationData = 
  | FollowRequestNotificationData
  | FollowAcceptedNotificationData
  | GroupInviteNotificationData
  | GroupRequestNotificationData
  | GroupEventNotificationData
  | PostLikeNotificationData
  | PostCommentNotificationData;

// Notification type enum
export enum NotificationType {
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_ACCEPTED = 'follow_accepted',
  GROUP_INVITE = 'group_invite',
  GROUP_REQUEST = 'group_request',
  GROUP_JOIN_REQUEST = 'group_join_request',
  GROUP_EVENT = 'group_event',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
}
