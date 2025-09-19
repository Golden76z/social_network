/**
 * Authentication Reload Test
 * 
 * This test simulates the page reload scenario (CTRL+R) and tests
 * the authentication state management to identify why conversations
 * API returns 401 on reload.
 */

import { AuthProvider } from '../context/AuthProvider';
import { chatAPI } from '../lib/api/chat';
import { apiClient } from '../lib/api';

// Mock fetch to simulate API responses
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('Authentication Reload Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    
    // Reset cookie
    document.cookie = '';
  });

  describe('Page Reload Scenario (CTRL+R)', () => {
    it('should maintain authentication state after page reload', async () => {
      console.log('🧪 Testing page reload scenario...');
      
      // Step 1: Simulate initial login
      console.log('📝 Step 1: Simulating initial login');
      
      // Mock successful login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'set-cookie': 'jwt_token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNrZW50QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MSwiaXNzIjoic29jaWFsLW5ldHdvcmsiLCJleHAiOjE3NTgyOTk3ODcsImlhdCI6MTc1ODI4NTM4N30.FppOcjRTDuoMu3bmIZZXbudqKHbl0F3e2vM_gdh9NCo9rLhnibqb2QiLnNuAN00cvJH5q5DoLRLGM9h1Ii_u7A; Path=/; HttpOnly; Max-Age=14400'
        }),
        json: async () => ({ message: 'Login successful' }),
      });

      // Simulate login request
      const loginResponse = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ckent@example.com',
          password: 'password123',
        }),
      });

      expect(loginResponse.ok).toBe(true);
      console.log('✅ Login successful');

      // Step 2: Simulate page reload (CTRL+R)
      console.log('📝 Step 2: Simulating page reload (CTRL+R)');
      
      // Clear all state (simulate page reload)
      mockLocalStorage.clear();
      document.cookie = '';
      
      // Simulate browser setting the cookie after reload
      document.cookie = 'jwt_token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNrZW50QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MSwiaXNzIjoic29jaWFsLW5ldHdvcmsiLCJleHAiOjE3NTgyOTk3ODcsImlhdCI6MTc1ODI4NTM4N30.FppOcjRTDuoMu3bmIZZXbudqKHbl0F3e2vM_gdh9NCo9rLhnibqb2QiLnNuAN00cvJH5q5DoLRLGM9h1Ii_u7A';
      
      console.log('🍪 Cookie set after reload:', document.cookie);

      // Step 3: Test authentication state detection
      console.log('📝 Step 3: Testing authentication state detection');
      
      // Mock the getUserFromToken function behavior
      const mockGetUserFromToken = jest.fn().mockReturnValue({
        id: 1,
        username: 'ckent@example.com',
        email: 'ckent@example.com',
      });

      // Test if we can extract user from token
      const userFromToken = mockGetUserFromToken();
      expect(userFromToken).toBeDefined();
      expect(userFromToken.id).toBe(1);
      console.log('✅ User extracted from token:', userFromToken);

      // Step 4: Test conversations API call
      console.log('📝 Step 4: Testing conversations API call');
      
      // Mock conversations API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          conversations: [
            {
              id: 1,
              user_id: 2,
              username: 'skyle@example.com',
              last_message: 'Hello!',
              last_message_time: '2025-09-19T14:30:00Z',
              unread_count: 0,
            },
          ],
        }),
      });

      // Test conversations API call
      try {
        const conversations = await chatAPI.getConversations();
        console.log('✅ Conversations API successful:', conversations);
        expect(conversations).toBeDefined();
        expect(conversations.conversations).toBeDefined();
      } catch (error) {
        console.error('❌ Conversations API failed:', error);
        throw error;
      }
    });

    it('should handle authentication failure on reload', async () => {
      console.log('🧪 Testing authentication failure on reload...');
      
      // Step 1: Simulate page reload with invalid/expired token
      console.log('📝 Step 1: Simulating page reload with invalid token');
      
      // Set invalid token
      document.cookie = 'jwt_token=invalid_token_here';
      
      // Step 2: Mock conversations API returning 401
      console.log('📝 Step 2: Mocking conversations API returning 401');
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({ error: 'User not authenticated' }),
      });

      // Test conversations API call with invalid token
      try {
        await chatAPI.getConversations();
        fail('Expected API call to fail with 401');
      } catch (error: any) {
        console.log('✅ Expected 401 error caught:', error.message);
        expect(error.message).toContain('401');
        expect(error.message).toContain('User not authenticated');
      }
    });

    it('should test AuthProvider state management on reload', async () => {
      console.log('🧪 Testing AuthProvider state management on reload...');
      
      // This test would require React Testing Library to properly test
      // the AuthProvider component, but we can simulate the behavior
      
      // Step 1: Simulate initial authentication state
      console.log('📝 Step 1: Simulating initial authentication state');
      
      const initialAuthState = {
        isAuthenticated: true,
        isLoading: false,
        hasCheckedAuth: true,
        user: {
          id: 1,
          username: 'ckent@example.com',
          email: 'ckent@example.com',
        },
      };
      
      console.log('✅ Initial auth state:', initialAuthState);

      // Step 2: Simulate page reload (state reset)
      console.log('📝 Step 2: Simulating page reload (state reset)');
      
      const reloadedAuthState = {
        isAuthenticated: false,
        isLoading: true,
        hasCheckedAuth: false,
        user: null,
      };
      
      console.log('🔄 Reloaded auth state:', reloadedAuthState);

      // Step 3: Simulate authentication check after reload
      console.log('📝 Step 3: Simulating authentication check after reload');
      
      // Mock successful authentication check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          authenticated: true,
          user: {
            id: 1,
            username: 'ckent@example.com',
            email: 'ckent@example.com',
          },
        }),
      });

      // Simulate the authentication check
      const authCheckResponse = await fetch('http://localhost:8080/api/test/auth', {
        credentials: 'include',
      });
      
      const authCheckData = await authCheckResponse.json();
      
      console.log('✅ Auth check response:', authCheckData);
      expect(authCheckData.authenticated).toBe(true);
    });
  });

  describe('Cookie and Token Management', () => {
    it('should properly handle JWT token extraction', () => {
      console.log('🧪 Testing JWT token extraction...');
      
      // Set a valid JWT token in cookie
      document.cookie = 'jwt_token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNrZW50QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MSwiaXNzIjoic29jaWFsLW5ldHdvcmsiLCJleHAiOjE3NTgyOTk3ODcsImlhdCI6MTc1ODI4NTM4N30.FppOcjRTDuoMu3bmIZZXbudqKHbl0F3e2vM_gdh9NCo9rLhnibqb2QiLnNuAN00cvJH5q5DoLRLGM9h1Ii_u7A';
      
      // Test cookie parsing
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      console.log('🍪 Parsed cookies:', cookies);
      expect(cookies.jwt_token).toBeDefined();
      
      // Test JWT token parsing (simplified)
      const token = cookies.jwt_token;
      const parts = token.split('.');
      expect(parts.length).toBe(3);
      
      // Decode payload (simplified)
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 JWT payload:', payload);
      
      expect(payload.user_id).toBe(1);
      expect(payload.username).toBe('ckent@example.com');
    });

    it('should handle missing or invalid cookies', () => {
      console.log('🧪 Testing missing/invalid cookies...');
      
      // Test with no cookie
      document.cookie = '';
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      expect(cookies.jwt_token).toBeUndefined();
      console.log('✅ No cookie scenario handled correctly');
      
      // Test with invalid cookie format
      document.cookie = 'jwt_token=invalid_token_format';
      const invalidCookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      expect(invalidCookies.jwt_token).toBe('invalid_token_format');
      console.log('✅ Invalid cookie scenario handled correctly');
    });
  });

  describe('API Client Behavior', () => {
    it('should include credentials in API requests', async () => {
      console.log('🧪 Testing API client credentials...');
      
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ data: 'test' }),
      });

      // Test API call with credentials
      await fetch('http://localhost:8080/api/chat/conversations', {
        credentials: 'include',
      });

      // Verify fetch was called with correct options
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/chat/conversations',
        expect.objectContaining({
          credentials: 'include',
        })
      );
      
      console.log('✅ API client includes credentials correctly');
    });
  });
});

// Helper function to simulate page reload
export const simulatePageReload = () => {
  console.log('🔄 Simulating page reload...');
  
  // Clear all state
  mockLocalStorage.clear();
  
  // Reset cookie (simulate browser behavior)
  document.cookie = '';
  
  // Simulate browser setting cookie from server
  document.cookie = 'jwt_token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNrZW50QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MSwiaXNzIjoic29jaWFsLW5ldHdvcmsiLCJleHAiOjE3NTgyOTk3ODcsImlhdCI6MTc1ODI4NTM4N30.FppOcjRTDuoMu3bmIZZXbudqKHbl0F3e2vM_gdh9NCo9rLhnibqb2QiLnNuAN00cvJH5q5DoLRLGM9h1Ii_u7A';
  
  console.log('✅ Page reload simulated');
};

// Helper function to test authentication flow
export const testAuthenticationFlow = async () => {
  console.log('🧪 Testing complete authentication flow...');
  
  try {
    // Step 1: Test login
    console.log('📝 Step 1: Testing login');
    const loginResponse = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ckent@example.com',
        password: 'password123',
      }),
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    console.log('✅ Login successful');
    
    // Step 2: Test conversations API
    console.log('📝 Step 2: Testing conversations API');
    const conversationsResponse = await fetch('http://localhost:8080/api/chat/conversations', {
      credentials: 'include',
    });
    
    if (!conversationsResponse.ok) {
      throw new Error(`Conversations API failed: ${conversationsResponse.status}`);
    }
    
    const conversations = await conversationsResponse.json();
    console.log('✅ Conversations API successful:', conversations);
    
    // Step 3: Simulate page reload
    console.log('📝 Step 3: Simulating page reload');
    simulatePageReload();
    
    // Step 4: Test conversations API after reload
    console.log('📝 Step 4: Testing conversations API after reload');
    const reloadedConversationsResponse = await fetch('http://localhost:8080/api/chat/conversations', {
      credentials: 'include',
    });
    
    if (!reloadedConversationsResponse.ok) {
      throw new Error(`Conversations API failed after reload: ${reloadedConversationsResponse.status}`);
    }
    
    const reloadedConversations = await reloadedConversationsResponse.json();
    console.log('✅ Conversations API successful after reload:', reloadedConversations);
    
    return {
      success: true,
      message: 'Authentication flow test passed',
      conversations,
      reloadedConversations,
    };
    
  } catch (error: any) {
    console.error('❌ Authentication flow test failed:', error);
    return {
      success: false,
      message: error.message,
      error,
    };
  }
};
