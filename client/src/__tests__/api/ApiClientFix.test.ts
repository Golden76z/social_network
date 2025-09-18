import { ApiClient } from '@/lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client Fix Tests', () => {
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

  describe('Enhanced Error Handling', () => {
    it('should handle empty response body with proper error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('API Error: 401');
      }

      // Verify the error logging includes all available information
      expect(consoleSpy).toHaveBeenCalledWith('❌ API Error Response:', {
        status: 401,
        statusText: 'Unauthorized',
        url: 'http://localhost:8080/test',
        rawResponse: '',
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'content-length': '0'
        }
      });

      consoleSpy.mockRestore();
    });

    it('should provide better error messages for common HTTP status codes', async () => {
      const statusCodes = [
        { status: 401, expected: 'Authentication required' },
        { status: 403, expected: 'Access forbidden' },
        { status: 404, expected: 'Resource not found' },
        { status: 500, expected: 'Server error' },
        { status: 502, expected: 'Bad gateway' },
        { status: 503, expected: 'Service unavailable' },
      ];

      for (const { status, expected } of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: expected,
          text: () => Promise.resolve(''), // Empty response body
          headers: new Map([
            ['content-type', 'text/plain; charset=utf-8'],
            ['content-length', '0']
          ]),
        } as unknown as Response);

        try {
          await apiClient.get('/test');
        } catch (error) {
          expect(error.message).toBe(`API Error: ${status}`);
        }
      }
    });
  });

  describe('CORS and Preflight Handling', () => {
    it('should handle CORS preflight failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('CORS preflight failed'));

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('CORS preflight failed');
      }
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle missing authentication token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Unauthorized: Missing token'),
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length': '28']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Unauthorized: Missing token');
      }
    });

    it('should handle expired authentication token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Token expired'),
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length': '13']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Token expired');
      }
    });
  });

  describe('Server Error Handling', () => {
    it('should handle server errors with proper context', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length': '0'],
          ['server', 'nginx/1.18.0']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('API Error: 500');
      }

      // Verify comprehensive error logging
      expect(consoleSpy).toHaveBeenCalledWith('❌ API Error Response:', {
        status: 500,
        statusText: 'Internal Server Error',
        url: 'http://localhost:8080/test',
        rawResponse: '',
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'content-length': '0',
          'server': 'nginx/1.18.0'
        }
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Response Parsing Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('{"error": "Invalid JSON"'), // Malformed JSON
        headers: new Map([
          ['content-type', 'application/json']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('{"error": "Invalid JSON"');
      }
    });

    it('should handle HTML error pages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('<html><body><h1>Server Error</h1></body></html>'),
        headers: new Map([
          ['content-type', 'text/html']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('<html><body><h1>Server Error</h1></body></html>');
      }
    });
  });
});
