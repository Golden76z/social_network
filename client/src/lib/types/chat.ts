import { User } from './user';

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  sender: User;
  messageType: MessageType;
  timestamp: string;
  isRead: boolean;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType?: MessageType;
}

export type MessageType = 'text' | 'image' | 'file';