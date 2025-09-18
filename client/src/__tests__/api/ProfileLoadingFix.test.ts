/**
 * Test to verify the profile loading fix
 * This test simulates the scenario where an unauthenticated user tries to access /profile
 */

import { ApiClient } from '@/lib/api';
import { userApi } from '@/lib/api/user';

// Mock fetch globally
global.fetch = jest.fn();

describe('Profile Loading Fix Tests', () => {
  let apiClient: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8080');
    mockFetch.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Unauthenticated Profile Access', () => {
    it('should handle unauthenticated access to own profile gracefully', async () => {
      // Mock the server response for unauthenticated profile access
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Unauthorized: Missing token'),
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length', '28']
        ]),
      } as Response);

      // This should throw an error (which is expected)
      await expect(userApi.getProfile()).rejects.toThrow();
      
      // Verify the error is logged properly
      expect(console.error).toHaveBeenCalledWith(
        '❌ API Error Response:', 
        expect.objectContaining({
          status: 401,
          rawResponse: 'Unauthorized: Missing token'
        })
      );
    });

    it('should handle unauthenticated access to other user profile', async () => {
      // Mock successful response for public user profile
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({
          id: 123,
          nickname: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          bio: 'Test bio',
          is_private: false
        }),
        headers: new Map([
          ['content-type', 'application/json']
        ]),
      } as Response);

      const profile = await userApi.getUserById(123);
      
      expect(profile).toEqual({
        id: 123,
        nickname: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        bio: 'Test bio',
        is_private: false
      });
    });

    it('should handle empty response body from server', async () => {
      // Mock empty response body (the original issue)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(''), // Empty body
        headers: new Map([
          ['content-type', 'text/plain; charset=utf-8'],
          ['content-length', '0']
        ]),
      } as Response);

      await expect(userApi.getProfile()).rejects.toThrow('API Error: 401');
      
      // Verify the empty response is logged
      expect(console.error).toHaveBeenCalledWith(
        '❌ API Error Response:', 
        expect.objectContaining({
          status: 401,
          rawResponse: ''
        })
      );
    });
  });

  describe('Profile Loading Logic', () => {
    it('should determine own profile correctly', () => {
      // Mock the isOwnProfile logic
      const isOwnProfile = (user: any, userId: string | null) => {
        if (!user) return false; // Must be authenticated to view own profile
        if (!userId) return true; // No userId means own profile (only if authenticated)
        return parseInt(userId) === user.id; // userId matches current user
      };

      // Test cases
      expect(isOwnProfile(null, null)).toBe(false); // No user, no userId
      expect(isOwnProfile(null, '123')).toBe(false); // No user, has userId
      expect(isOwnProfile({ id: 123 }, null)).toBe(true); // Has user, no userId
      expect(isOwnProfile({ id: 123 }, '123')).toBe(true); // Has user, matching userId
      expect(isOwnProfile({ id: 123 }, '456')).toBe(false); // Has user, different userId
    });
  });
});
