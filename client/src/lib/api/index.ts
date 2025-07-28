// src/lib/api/index.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // No need to add baseUrl if endpoint is already a full path from your routes
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    // Cookie-based authentication setup (matching your AuthContext)
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...options.headers,
    };

    console.log('🌐 Making API request to:', url);
    console.log('🍪 Sending cookies:', document.cookie);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // This sends cookies (including jwt_token)
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response data:', data);
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Utility method to check if user is authenticated by checking cookie
  isAuthenticated(): boolean {
    if (typeof document === 'undefined') return false; // SSR safety
    const hasToken = document.cookie.includes('jwt_token=');
    console.log('🍪 Cookie check - Has jwt_token:', hasToken);
    console.log('🍪 All cookies:', document.cookie);
    return hasToken;
  }

  // Utility method to get user data from JWT token (client-side only)
  getUserFromToken(): { userid?: string; username?: string } | null {
    if (typeof document === 'undefined') return null; // SSR safety
    
    try {
      const cookies = document.cookie.split(';');
      const jwtCookie = cookies.find(cookie => cookie.trim().startsWith('jwt_token='));
      
      if (!jwtCookie) return null;
      
      const token = jwtCookie.split('=')[1];
      if (!token) return null;

      // Decode JWT payload (assuming HS256 - we only decode, not verify)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      return {
        userid: payload.userid || payload.id || payload.user_id,
        username: payload.username || payload.user || payload.name
      };
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }
}

export const apiClient = new ApiClient();