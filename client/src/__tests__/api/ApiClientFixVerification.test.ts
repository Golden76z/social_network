import { fixedApiClient } from '@/lib/api/apiClientFix';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client Fix Verification', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
    
    // Mock document.cookie
    let cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookieValue,
      set: (value) => { cookieValue = value; },
      configurable: true,
    });
  });

  describe('Empty Response Body Fix', () => {
    it('should handle empty response body with proper error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(''), // Empty response body - this is the issue
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length', '0']
        ]),
      } as unknown as Response);

      try {
        await fixedApiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Unauthorized - Authentication required. Please log in.');
      }

      // Verify the error logging includes the issue identification
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Fixed API Error Response:', expect.objectContaining({
        status: 401,
        statusText: 'Unauthorized',
        url: 'http://localhost:8080/test',
        rawResponse: '',
        errorMessage: 'Unauthorized - Authentication required. Please log in.',
        issue: 'Server returned empty response body'
      }));

      consoleSpy.mockRestore();
    });

    it('should handle proper error response from server', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Unauthorized: Missing token'), // Proper error message
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length', '28']
        ]),
      } as unknown as Response);

      try {
        await fixedApiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Unauthorized: Missing token');
      }

      // Verify the error logging identifies this as a proper error response
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Fixed API Error Response:', expect.objectContaining({
        status: 401,
        statusText: 'Unauthorized',
        url: 'http://localhost:8080/test',
        rawResponse: 'Unauthorized: Missing token',
        errorMessage: 'Unauthorized: Missing token',
        issue: 'Server returned proper error message'
      }));

      consoleSpy.mockRestore();
    });

    it('should provide meaningful error messages for different status codes', async () => {
      const statusCodes = [
        { status: 401, expected: 'Unauthorized - Authentication required. Please log in.' },
        { status: 403, expected: 'Forbidden - Access denied. You may not have permission to access this resource.' },
        { status: 404, expected: 'Not Found - The requested resource does not exist.' },
        { status: 500, expected: 'Internal Server Error - The server encountered an unexpected error.' },
      ];

      for (const { status, expected } of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          text: () => Promise.resolve(''), // Empty response body
          headers: new Map([
            ['content-type', 'text/plain; charset=utf-8'],
            ['content-length', '0']
          ]),
        } as unknown as Response);

        try {
          await fixedApiClient.get('/test');
        } catch (error) {
          expect(error.message).toBe(expected);
        }
      }
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fixedApiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle CORS errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('CORS preflight failed'));

      try {
        await fixedApiClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('CORS preflight failed');
      }
    });
  });

  describe('Success Response Handling', () => {
    it('should handle successful responses correctly', async () => {
      const mockData = { id: 1, name: 'Test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockData),
        headers: new Map([
          ['content-type', 'application/json']
        ]),
      } as unknown as Response);

      const result = await fixedApiClient.get('/test');
      expect(result).toEqual(mockData);
    });

    it('should handle text responses correctly', async () => {
      const mockText = 'Success response';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(mockText),
        headers: new Map([
          ['content-type', 'text/plain']
        ]),
      } as unknown as Response);

      const result = await fixedApiClient.get('/test');
      expect(result).toBe(mockText);
    });
  });
});
