import { Conversation, PrivateMessage, GroupMessage, SendMessageRequest, SendGroupMessageRequest } from '../types/chat';

export interface GroupConversation {
  group_id: number;
  group_name: string;
  group_description: string;
  group_avatar?: string;
  last_message: string;
  last_message_time: string;
}

import { config } from '@/config/environment';

const API_BASE_URL = config.API_BASE_URL;

class ChatAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    try {
      return await this.request<Conversation[]>('/api/chat/conversations');
    } catch (error) {
      console.error('Failed to get conversations:', error);
      // Return empty array instead of throwing error to prevent null data issues
      return [];
    }
  }

  // Get messages between current user and another user
  async getMessages(userId: number, limit: number = 20, offset: number = 0): Promise<PrivateMessage[]> {
    const params = new URLSearchParams({
      user_id: userId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });

    try {
      const result = await this.request<PrivateMessage[]>(`/api/chat/messages?${params}`);

      // Handle null response from backend (backend returns null when no messages)
      if (result === null || result === undefined) {
        return [];
      }

      // Ensure we return an array
      if (!Array.isArray(result)) {
        return [];
      }

      return result;
    } catch (error) {
      console.error('Failed to get messages:', error);
      // Return empty array instead of throwing error to prevent null data issues
      return [];
    }
  }

  // Send a private message
  async sendMessage(message: SendMessageRequest): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Get group messages
  async getGroupMessages(groupId: number, limit: number = 20, offset: number = 0): Promise<GroupMessage[]> {
    const params = new URLSearchParams({
      group_id: groupId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    try {
      return await this.request<GroupMessage[]>(`/api/chat/group-messages?${params}`);
    } catch (error) {
      console.error('Failed to get group messages:', error);
      // Return empty array instead of throwing error to prevent null data issues
      return [];
    }
  }

  // Send a group message
  async sendGroupMessage(message: SendGroupMessageRequest): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/chat/group-message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Get group conversations for the current user
  async getGroupConversations(): Promise<GroupConversation[]> {
    try {
      return await this.request<GroupConversation[]>('/api/chat/group-conversations');
    } catch (error) {
      console.error('Failed to get group conversations:', error);
      // Return empty array instead of throwing error to prevent null data issues
      return [];
    }
  }

  // Get users that can be messaged (followers + following + public users)
  async getMessageableUsers(): Promise<unknown[]> {
    return this.request<unknown[]>('/api/chat/messageable-users');
  }
}

export const chatAPI = new ChatAPI();
