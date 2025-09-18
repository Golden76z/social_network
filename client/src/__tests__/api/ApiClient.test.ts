import { ApiClient } from '@/lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8080');
    mockFetch.mockClear();
    
    // Mock document.cookie with getter/setter
    let cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookieValue,
      set: (value) => { cookieValue = value; },
      configurable: true,
    });
  });

  describe('getUserFromToken', () => {
    it('should return null when no JWT token exists', () => {
      document.cookie = 'other_cookie=value';
      
      const result = apiClient.getUserFromToken();
      
      expect(result).toBeNull();
    });

    it('should parse valid JWT token', () => {
      const mockPayload = {
        userid: '123',
        username: 'testuser',
        exp: 1734567200,
      };
      
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      document.cookie = `jwt_token=${mockToken}`;
      
      
      const result = apiClient.getUserFromToken();
      
      expect(result).toEqual({
        userid: '123',
        username: 'testuser',
      });
    });

    it('should handle JWT token with different field names', () => {
      const mockPayload = {
        id: '456',
        user: 'anotheruser',
        exp: 1734567200,
      };
      
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      document.cookie = `jwt_token=${mockToken}`;
      
      const result = apiClient.getUserFromToken();
      
      expect(result).toEqual({
        userid: '456',
        username: 'anotheruser',
      });
    });

    it('should return null for invalid JWT format', () => {
      document.cookie = 'jwt_token=invalid.token';
      
      const result = apiClient.getUserFromToken();
      
      expect(result).toBeNull();
    });

    it('should return null for malformed JWT payload', () => {
      document.cookie = 'jwt_token=header.invalid-base64.signature';
      
      const result = apiClient.getUserFromToken();
      
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when JWT token exists', () => {
      document.cookie = 'jwt_token=some.token.value';
      
      const result = apiClient.isAuthenticated();
      
      expect(result).toBe(true);
    });

    it('should return false when no JWT token exists', () => {
      document.cookie = 'other_cookie=value';
      
      const result = apiClient.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });

  describe('request method', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          }),
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make successful POST request', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'test' };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['X-CSRF-Token', 'csrf-token-123']]),
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as unknown as Response);

      const result = await apiClient.post('/test', requestData);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 
        'http://localhost:8080/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          }),
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found'),
      } as Response);

      await expect(apiClient.get('/nonexistent')).rejects.toThrow('Not Found');
    });

    it('should handle JSON error responses', async () => {
      const errorResponse = { error: 'Validation failed' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      } as Response);

      await expect(apiClient.get('/invalid')).rejects.toThrow('Validation failed');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should include CSRF token for state-changing requests', async () => {
      // Mock CSRF token fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['X-CSRF-Token', 'csrf-token-123']]),
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response);

      await apiClient.post('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 
        'http://localhost:8080/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'csrf-token-123',
          }),
        })
      );
    });
  });

  describe('CSRF token handling', () => {
    it('should fetch CSRF token for POST requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['X-CSRF-Token', 'csrf-token-123']]),
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response);

      await apiClient.post('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/posts', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    });

    it('should not fetch CSRF token for GET requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });
});
