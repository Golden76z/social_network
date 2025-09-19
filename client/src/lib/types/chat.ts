import { User } from './user';

export type { User };

// Backend API types
export interface Conversation {
  other_user_id: number;
  other_user_nickname: string;
  other_user_first_name: string;
  other_user_last_name: string;
  other_user_avatar: string;
  other_user_is_private: boolean;
  last_message: string;
  last_message_time: string;
}

export interface PrivateMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  body: string;
  created_at: string;
}

export interface GroupMessage {
  id: number;
  group_id: number;
  sender_id: number;
  body: string;
  created_at: string;
}

export interface SendMessageRequest {
  receiver_id: number;
  body: string;
}

export interface SendGroupMessageRequest {
  group_id: number;
  body: string;
}

// Frontend UI types
export interface ChatMessage {
  id: string;
  username?: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  groupId?: string;
}

export interface WebSocketMessage {
  type: string;
  user_id?: number;
  username?: string;
  content?: string;
  group_id?: string;
  data?: any;
  timestamp: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'emoji';