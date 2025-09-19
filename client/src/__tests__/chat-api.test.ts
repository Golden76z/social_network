import { chatAPI } from '@/lib/api/chat';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Chat API Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getConversations', () => {
    it('should handle successful response', async () => {
      const mockConversations = [
        {
          other_user_id: 1,
          other_user_nickname: 'testuser',
          other_user_first_name: 'Test',
          other_user_last_name: 'User',
          other_user_avatar: '',
          other_user_is_private: false,
          last_message: 'Hello!',
          last_message_time: '2024-01-01T12:00:00Z'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversations,
      });

      const result = await chatAPI.getConversations();
      expect(result).toEqual(mockConversations);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/chat/conversations',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      );
    });

    it('should handle empty response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await chatAPI.getConversations();
      expect(result).toEqual([]);
    });

    it('should handle server error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(chatAPI.getConversations()).rejects.toThrow('API Error: 500 - Internal Server Error');
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(chatAPI.getConversations()).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Unexpected end of JSON input');
        },
      });

      await expect(chatAPI.getConversations()).rejects.toThrow('Unexpected end of JSON input');
    });

    it('should handle empty response body', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Unexpected end of JSON input');
        },
      });

      await expect(chatAPI.getConversations()).rejects.toThrow('Unexpected end of JSON input');
    });
  });

  describe('getMessages', () => {
    it('should handle successful response', async () => {
      const mockMessages = [
        {
          id: 1,
          sender_id: 1,
          receiver_id: 2,
          body: 'Hello!',
          created_at: '2024-01-01T12:00:00Z'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessages,
      });

      const result = await chatAPI.getMessages(2, 50, 0);
      expect(result).toEqual(mockMessages);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/chat/messages?user_id=2&limit=50&offset=0',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      );
    });
  });

  describe('sendMessage', () => {
    it('should handle successful response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' }),
      });

      const result = await chatAPI.sendMessage({
        receiver_id: 2,
        body: 'Hello!'
      });
      expect(result).toEqual({ status: 'success' });
    });
  });
});
