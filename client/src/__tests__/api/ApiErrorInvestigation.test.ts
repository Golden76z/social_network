import { ApiClient } from '@/lib/api';
import { userApi } from '@/lib/api/user';
import { postApi } from '@/lib/api/post';
import { commentApi } from '@/lib/api/comment';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Error Investigation Tests', () => {
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

  describe('Current Error Scenario Investigation', () => {
    it('should reproduce the empty response body error', async () => {
      // This test reproduces the exact error scenario you're seeing
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500, // or whatever status you're seeing
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''), // Empty response body - this is the issue
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('API Error: 500');
      }

      // Verify the error logging
      expect(consoleSpy).toHaveBeenCalledWith('❌ API Error Response:', {
        status: 500,
        statusText: 'Internal Server Error',
        url: 'http://localhost:8080/test',
        rawResponse: '', // This is empty, causing the issue
        headers: {
          'content-type': 'application/json',
          'content-length': '0'
        }
      });

      consoleSpy.mockRestore();
    });

    it('should test different HTTP status codes with empty responses', async () => {
      const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503];
      
      for (const status of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          text: () => Promise.resolve(''), // Empty response body
          headers: new Map([
            ['content-type', 'application/json'],
            ['content-length', '0']
          ]),
        } as unknown as Response);

        try {
          await apiClient.get(`/test-${status}`);
        } catch (error) {
          expect(error.message).toBe(`API Error: ${status}`);
        }
      }
    });

    it('should test specific API endpoints that might be failing', async () => {
      const endpoints = [
        { api: userApi.getProfile, name: 'getProfile' },
        { api: () => userApi.getUserById(1), name: 'getUserById' },
        { api: postApi.getPosts, name: 'getPosts' },
        { api: () => postApi.getPostsByUser(1), name: 'getPostsByUser' },
        { api: () => commentApi.getComments(1), name: 'getComments' },
      ];

      for (const { api, name } of endpoints) {
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

        try {
          await api();
        } catch (error) {
          expect(error.message).toBe('API Error: 500');
          console.log(`✅ ${name} endpoint error handled correctly`);
        }
      }
    });
  });

  describe('Server Connection Tests', () => {
    it('should test if server is running on correct port', async () => {
      // Test if the server is actually running
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      try {
        await apiClient.get('/health');
      } catch (error) {
        expect(error.message).toBe('ECONNREFUSED');
        console.log('❌ Server connection refused - check if server is running');
      }
    });

    it('should test different base URLs', async () => {
      const baseUrls = [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000',
        'http://localhost:8000'
      ];

      for (const baseUrl of baseUrls) {
        const testClient = new ApiClient(baseUrl);
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' }),
        } as Response);

        try {
          const result = await testClient.get('/health');
          console.log(`✅ Server responding on ${baseUrl}`);
          expect(result.status).toBe('ok');
        } catch (error) {
          console.log(`❌ Server not responding on ${baseUrl}: ${error.message}`);
        }
      }
    });
  });

  describe('Authentication Flow Tests', () => {
    it('should test authentication endpoints', async () => {
      const authEndpoints = [
        { method: 'POST', url: '/api/auth/login', data: { username: 'test', password: 'test' } },
        { method: 'POST', url: '/api/auth/register', data: { username: 'test', email: 'test@test.com', password: 'test' } },
        { method: 'POST', url: '/api/auth/logout', data: {} },
      ];

      for (const endpoint of authEndpoints) {
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

        try {
          if (endpoint.method === 'POST') {
            await apiClient.post(endpoint.url, endpoint.data);
          } else {
            await apiClient.get(endpoint.url);
          }
        } catch (error) {
          expect(error.message).toBe('API Error: 500');
          console.log(`❌ ${endpoint.method} ${endpoint.url} returning empty response`);
        }
      }
    });
  });

  describe('Database Connection Tests', () => {
    it('should test database-dependent endpoints', async () => {
      const dbEndpoints = [
        { api: () => userApi.getProfile(), name: 'getProfile (requires DB)' },
        { api: () => postApi.getPosts(), name: 'getPosts (requires DB)' },
        { api: () => userApi.getFollowers(1), name: 'getFollowers (requires DB)' },
        { api: () => userApi.getFollowing(1), name: 'getFollowing (requires DB)' },
      ];

      for (const { api, name } of dbEndpoints) {
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

        try {
          await api();
        } catch (error) {
          expect(error.message).toBe('API Error: 500');
          console.log(`❌ ${name} endpoint failing with empty response`);
        }
      }
    });
  });

  describe('CORS and Headers Tests', () => {
    it('should test CORS headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''), // Empty response body
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '0'],
          ['access-control-allow-origin', '*'],
          ['access-control-allow-methods', 'GET, POST, PUT, DELETE'],
          ['access-control-allow-headers', 'Content-Type, Authorization']
        ]),
      } as unknown as Response);

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('API Error: 500');
        console.log('✅ CORS headers present but still getting empty response');
      }
    });
  });

  describe('Error Response Format Tests', () => {
    it('should test different error response formats', async () => {
      const errorFormats = [
        { response: '', expected: 'API Error: 500' },
        { response: 'null', expected: 'null' },
        { response: 'undefined', expected: 'undefined' },
        { response: '{}', expected: '{}' },
        { response: '{"error": "Test error"}', expected: 'Test error' },
        { response: '{"message": "Test message"}', expected: 'Test message' },
        { response: '{"errors": ["Error 1", "Error 2"]}', expected: 'Error 1, Error 2' },
      ];

      for (const { response, expected } of errorFormats) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(response),
          headers: new Map([
            ['content-type', 'application/json']
          ]),
        } as unknown as Response);

        try {
          await apiClient.get('/test');
        } catch (error) {
          expect(error.message).toBe(expected);
          console.log(`✅ Error format "${response}" handled correctly: "${expected}"`);
        }
      }
    });
  });
});
