import { ApiClient } from '@/lib/api';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import { commentApi } from '@/lib/api/comment';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Error Debug Tests', () => {
  let apiClient: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8080');
    mockFetch.mockClear();
    
    // Mock document.cookie
    let cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookieValue,
      set: (value) => { cookieValue = value; },
      configurable: true,
    });
  });

  describe('Empty Response Body Error Scenarios', () => {
    it('should handle empty response body with 500 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'text/plain'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('API Error: 500');
    });

    it('should handle empty response body with 404 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'text/html'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('API Error: 404');
    });

    it('should handle empty response body with 401 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('API Error: 401');
    });

    it('should handle empty response body with 403 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('API Error: 403');
    });
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network timeout');
    });

    it('should handle connection refused', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(apiClient.get('/test')).rejects.toThrow('Connection refused');
    });

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

      await expect(apiClient.get('/test')).rejects.toThrow('DNS resolution failed');
    });
  });

  describe('Server Error Scenarios', () => {
    it('should handle 502 Bad Gateway', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: () => Promise.resolve('Bad Gateway'),
        headers: new Map([
          ['content-type', 'text/html'],
          ['server', 'nginx/1.18.0']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Bad Gateway');
    });

    it('should handle 503 Service Unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve('Service temporarily unavailable'),
        headers: new Map([
          ['content-type', 'text/html'],
          ['retry-after', '60']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle 504 Gateway Timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
        text: () => Promise.resolve('Gateway timeout'),
        headers: new Map([
          ['content-type', 'text/html']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Gateway timeout');
    });
  });

  describe('Authentication Error Scenarios', () => {
    it('should handle expired JWT token', async () => {
      // Set expired token
      const expiredPayload = {
        userid: '123',
        username: 'testuser',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      document.cookie = `jwt_token=${expiredToken}`;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Token expired'),
        headers: new Map([
          ['content-type', 'application/json'],
          ['www-authenticate', 'Bearer']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Token expired');
    });

    it('should handle invalid JWT token', async () => {
      document.cookie = 'jwt_token=invalid.token';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid token'),
        headers: new Map([
          ['content-type', 'application/json']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid token');
    });
  });

  describe('CSRF Token Error Scenarios', () => {
    it('should handle CSRF token mismatch', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['X-CSRF-Token', 'csrf-token-123']]),
          json: () => Promise.resolve({ success: true }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: () => Promise.resolve('CSRF token mismatch'),
          headers: new Map([
            ['content-type', 'application/json']
          ]),
        } as unknown as Response);

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow('CSRF token mismatch');
    });

    it('should handle missing CSRF token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve('CSRF token required'),
        headers: new Map([
          ['content-type', 'application/json']
        ]),
      } as unknown as Response);

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow('CSRF token required');
    });
  });

  describe('Specific API Endpoint Error Tests', () => {
    it('should handle user profile fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(userApi.getUserById(999)).rejects.toThrow('API Error: 404');
    });

    it('should handle posts fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(postApi.getPosts()).rejects.toThrow('API Error: 500');
    });

    it('should handle comments fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      await expect(commentApi.getComments(1)).rejects.toThrow('API Error: 400');
    });
  });

  describe('Response Parsing Error Scenarios', () => {
    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('{"error": "Invalid JSON"'), // Malformed JSON
        headers: new Map([
          ['content-type', 'application/json']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('{"error": "Invalid JSON"');
    });

    it('should handle HTML error page response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('<html><body><h1>Server Error</h1></body></html>'),
        headers: new Map([
          ['content-type', 'text/html']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('<html><body><h1>Server Error</h1></body></html>');
    });
  });

  describe('CORS Error Scenarios', () => {
    it('should handle CORS preflight failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('CORS preflight failed'));

      await expect(apiClient.get('/test')).rejects.toThrow('CORS preflight failed');
    });

    it('should handle CORS policy violation', async () => {
      mockFetch.mockRejectedValueOnce(new Error('CORS policy violation'));

      await expect(apiClient.get('/test')).rejects.toThrow('CORS policy violation');
    });
  });

  describe('Rate Limiting Error Scenarios', () => {
    it('should handle rate limit exceeded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limit exceeded'),
        headers: new Map([
          ['content-type', 'application/json'],
          ['retry-after', '60'],
          ['x-ratelimit-limit', '100'],
          ['x-ratelimit-remaining', '0']
        ]),
      } as unknown as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Debug Information Collection', () => {
    it('should log comprehensive error information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0'],
          ['server', 'nginx/1.18.0'],
          ['date', 'Mon, 01 Jan 2024 12:00:00 GMT']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        // Error should be thrown
      }

      expect(consoleSpy).toHaveBeenCalledWith('❌ API Error Response:', {
        status: 500,
        statusText: 'Internal Server Error',
        url: 'http://localhost:8080/test',
        rawResponse: '',
        headers: {
          'content-type': 'application/json',
          'content-length': '0',
          'server': 'nginx/1.18.0',
          'date': 'Mon, 01 Jan 2024 12:00:00 GMT'
        }
      });

      consoleSpy.mockRestore();
    });
  });
});
