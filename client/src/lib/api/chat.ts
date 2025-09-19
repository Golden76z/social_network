import { Conversation, PrivateMessage, GroupMessage, SendMessageRequest, SendGroupMessageRequest } from '../types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

    return response.json();
  }

  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/chat/conversations');
  }

  // Get messages between current user and another user
  async getMessages(userId: number, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    const params = new URLSearchParams({
      user_id: userId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.request<PrivateMessage[]>(`/api/chat/messages?${params}`);
  }

  // Send a private message
  async sendMessage(message: SendMessageRequest): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Get group messages
  async getGroupMessages(groupId: number, limit: number = 50, offset: number = 0): Promise<GroupMessage[]> {
    const params = new URLSearchParams({
      group_id: groupId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.request<GroupMessage[]>(`/api/chat/group-messages?${params}`);
  }

  // Send a group message
  async sendGroupMessage(message: SendGroupMessageRequest): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/chat/group-message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Get users that can be messaged (followers + following + public users)
  async getMessageableUsers(): Promise<any[]> {
    return this.request<any[]>('/api/chat/messageable-users');
  }
}

export const chatAPI = new ChatAPI();
