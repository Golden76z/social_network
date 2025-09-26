import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivateChat } from '../components/chat/PrivateChat';
import { GroupChat } from '../components/chat/GroupChat';
import { WebSocketProvider } from '../context/webSocketProvider';
import { AuthProvider } from '../context/AuthProvider';
import { chatAPI } from '../lib/api/chat';
import { Conversation, GroupConversation } from '../lib/types/chat';

// Mock the chat API
vi.mock('../lib/api/chat', () => ({
  chatAPI: {
    getMessages: vi.fn(),
    getGroupMessages: vi.fn(),
    sendMessage: vi.fn(),
    sendGroupMessage: vi.fn(),
    getConversations: vi.fn(),
    getGroupConversations: vi.fn(),
  }
}));

// Mock the WebSocket context
const mockWebSocketContext = {
  socket: null,
  lastMessage: null,
  connectionStatus: 'connected' as const,
  sendMessage: vi.fn(),
  sendJson: vi.fn(),
  onlineUsers: [],
  reconnect: vi.fn(),
};

vi.mock('../context/webSocketProvider', () => ({
  useWebSocketContext: () => mockWebSocketContext,
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the auth context
const mockAuthContext = {
  user: {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    nickname: 'testuser',
  },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider url="ws://localhost:8080/ws">
      {children}
    </WebSocketProvider>
  </AuthProvider>
);

describe('Messaging Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return values
    (chatAPI.getMessages as Mock).mockResolvedValue([]);
    (chatAPI.getGroupMessages as Mock).mockResolvedValue([]);
    (chatAPI.sendMessage as Mock).mockResolvedValue({ status: 'success' });
    (chatAPI.sendGroupMessage as Mock).mockResolvedValue({ status: 'success' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PrivateChat Component', () => {
    const mockConversation: Conversation = {
      other_user_id: 2,
      other_user_nickname: 'testuser2',
      other_user_first_name: 'Test',
      other_user_last_name: 'User2',
      other_user_avatar: '',
      other_user_is_private: false,
      last_message: 'Hello!',
      last_message_time: '2023-01-01T10:00:00Z',
    };

    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );
      
      expect(screen.getByText('testuser2')).toBeInTheDocument();
    });

    it('should load messages on mount', async () => {
      const mockMessages = [
        {
          id: 1,
          sender_id: 1,
          receiver_id: 2,
          body: 'Hello!',
          created_at: '2023-01-01T10:00:00Z',
        },
        {
          id: 2,
          sender_id: 2,
          receiver_id: 1,
          body: 'Hi back!',
          created_at: '2023-01-01T10:01:00Z',
        },
      ];

      (chatAPI.getMessages as Mock).mockResolvedValue(mockMessages);

      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.getMessages).toHaveBeenCalledWith(2, 20, 0);
      });

      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
        expect(screen.getByText('Hi back!')).toBeInTheDocument();
      });
    });

    it('should handle null/empty message data gracefully', async () => {
      (chatAPI.getMessages as Mock).mockResolvedValue(null);

      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.getMessages).toHaveBeenCalledWith(2, 20, 0);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('No messages data received')).toBeInTheDocument();
      });
    });

    it('should handle empty array message data', async () => {
      (chatAPI.getMessages as Mock).mockResolvedValue([]);

      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.getMessages).toHaveBeenCalledWith(2, 20, 0);
      });

      // Should show no messages message
      await waitFor(() => {
        expect(screen.getByText('No messages yet')).toBeInTheDocument();
      });
    });

    it('should send message when form is submitted', async () => {
      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(chatAPI.sendMessage).toHaveBeenCalledWith({
          receiver_id: 2,
          body: 'Test message',
        });
      });
    });

    it('should handle WebSocket message updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      // Simulate receiving a WebSocket message
      const mockWebSocketMessage = {
        type: 'private_message',
        user_id: 2,
        username: 'testuser2',
        content: 'New message via WebSocket!',
        timestamp: '2023-01-01T10:02:00Z',
        data: {
          sender_id: 2,
          receiver_id: 1,
        },
      };

      // Update the mock context with the new message
      mockWebSocketContext.lastMessage = mockWebSocketMessage;

      // Re-render to trigger useEffect
      rerender(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('New message via WebSocket!')).toBeInTheDocument();
      });
    });

    it('should load more messages when Load More button is clicked', async () => {
      const mockMessages = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        sender_id: i % 2 === 0 ? 1 : 2,
        receiver_id: i % 2 === 0 ? 2 : 1,
        body: `Message ${i + 1}`,
        created_at: `2023-01-01T${10 + i}:00:00Z`,
      }));

      (chatAPI.getMessages as Mock).mockResolvedValue(mockMessages);

      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.getMessages).toHaveBeenCalledWith(2, 20, 0);
      });

      const loadMoreButton = screen.getByText('Load More Messages');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(chatAPI.getMessages).toHaveBeenCalledWith(2, 20, 20);
      });
    });
  });

  describe('GroupChat Component', () => {
    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <GroupChat groupId={1} groupName="Test Group" currentUserId={1} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('should load group messages on mount', async () => {
      const mockGroupMessages = [
        {
          id: 1,
          group_id: 1,
          sender_id: 1,
          body: 'Hello group!',
          created_at: '2023-01-01T10:00:00Z',
        },
        {
          id: 2,
          group_id: 1,
          sender_id: 2,
          body: 'Hi everyone!',
          created_at: '2023-01-01T10:01:00Z',
        },
      ];

      (chatAPI.getGroupMessages as Mock).mockResolvedValue(mockGroupMessages);

      render(
        <TestWrapper>
          <GroupChat groupId={1} groupName="Test Group" currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.getGroupMessages).toHaveBeenCalledWith(1, 20, 0);
      });

      await waitFor(() => {
        expect(screen.getByText('Hello group!')).toBeInTheDocument();
        expect(screen.getByText('Hi everyone!')).toBeInTheDocument();
      });
    });

    it('should handle null/empty group message data gracefully', async () => {
      (chatAPI.getGroupMessages as Mock).mockResolvedValue(null);

      render(
        <TestWrapper>
          <GroupChat groupId={1} groupName="Test Group" currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.getGroupMessages).toHaveBeenCalledWith(1, 20, 0);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('No messages data received')).toBeInTheDocument();
      });
    });

    it('should send group message when form is submitted', async () => {
      render(
        <TestWrapper>
          <GroupChat groupId={1} groupName="Test Group" currentUserId={1} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test group message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(chatAPI.sendGroupMessage).toHaveBeenCalledWith({
          group_id: 1,
          body: 'Test group message',
        });
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (chatAPI.getMessages as Mock).mockRejectedValue(new Error('API Error: 500 - Internal Server Error'));

      const mockConversation: Conversation = {
        other_user_id: 2,
        other_user_nickname: 'testuser2',
        other_user_first_name: 'Test',
        other_user_last_name: 'User2',
        other_user_avatar: '',
        other_user_is_private: false,
        last_message: 'Hello!',
        last_message_time: '2023-01-01T10:00:00Z',
      };

      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('API Error: 500 - Internal Server Error')).toBeInTheDocument();
      });
    });

    it('should handle send message API errors', async () => {
      (chatAPI.sendMessage as Mock).mockRejectedValue(new Error('Failed to send message'));

      const mockConversation: Conversation = {
        other_user_id: 2,
        other_user_nickname: 'testuser2',
        other_user_first_name: 'Test',
        other_user_last_name: 'User2',
        other_user_avatar: '',
        other_user_is_private: false,
        last_message: 'Hello!',
        last_message_time: '2023-01-01T10:00:00Z',
      };

      render(
        <TestWrapper>
          <PrivateChat conversation={mockConversation} currentUserId={1} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      });
    });
  });
});




