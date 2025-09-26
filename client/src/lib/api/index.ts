import { API_CONFIG, getApiUrl, getErrorMessage, getErrorCode, isRetryableError } from '@/lib/config/api';

const ensureWebSocketConnection = () => {
  if (typeof window === 'undefined') return;
  const reconnect = (window as any).__wsEnsureConnected;
  if (typeof reconnect === 'function') {
    try {
      // Only reconnect if WebSocket is not already connected or connecting
      const wsContext = (window as any).__wsContext;
      if (wsContext && wsContext.connectionStatus !== 'connected' && wsContext.connectionStatus !== 'connecting') {
        reconnect();
      }
    } catch (error) {
      console.error('🔌 Failed to ensure websocket connection:', error);
    }
  }
};

export class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = getApiUrl(endpoint);

    // Get CSRF token if we don't have one and this is a state-changing request
    if (!this.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
      await this.fetchCSRFToken();
    }

    // Get JWT token from localStorage
    const jwtToken = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}),
      ...(this.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET') 
        ? { 'X-CSRF-Token': this.csrfToken } 
        : {}),
      ...options.headers,
    };


    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    ensureWebSocketConnection();

    if (!response.ok) {
      // Read text first (body can be read only once), then try to parse JSON
      const raw = await response.text().catch(() => '');
      let message = raw || `API Error: ${response.status}`;
      
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed) {
          if (typeof parsed === 'string') message = parsed;
          else if (parsed.message || parsed.error) message = parsed.message || parsed.error;
          else message = JSON.stringify(parsed);
        }
      } catch {
        // leave message as raw/text
      }
      
      // Special handling for duplicate group request (409 Conflict)
      if (response.status === 409 && message.includes('already has a pending request')) {
        // Return a special response instead of throwing an error
        return {
          success: true,
          message: 'Request already exists',
          duplicate: true
        } as T;
      }
      
      // Create structured error object
      const error = {
        code: getErrorCode({ status: response.status, message }),
        message: getErrorMessage({ status: response.status, message }),
        status: response.status,
        url: url,
        details: raw,
      };
      
      // Log critical API errors only
      if (response.status >= 500) {
        console.error('❌ [API] Critical server error:', response.status, message);
      }
      
      ensureWebSocketConnection();
      throw error;
    }

    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      console.error('❌ [API] Failed to parse JSON response:', jsonError);
      ensureWebSocketConnection();
      throw new Error('Invalid JSON response from server');
    }
  }

  private async fetchCSRFToken(): Promise<void> {
    try {
      const response = await fetch(getApiUrl('/api/post'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const token = response.headers.get('X-CSRF-Token');
      if (token) {
        this.csrfToken = token;
      }
    } catch (error) {
      console.error('❌ [API] Failed to fetch CSRF token:', error);
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options,
      method: 'GET' 
    });
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('jwt_token');
  }

  // Get the raw JWT token
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  // NEW METHOD: Check if token is expired
  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        return true;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
      
      const payload = JSON.parse(atob(paddedBase64));
      
      // Check if token has exp claim and if it's expired
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = currentTime >= payload.exp;
        return isExpired;
      }
      
      return false; // If no exp claim, assume valid
    } catch (err) {
      console.error('❌ [API] Error checking token expiration:', err);
      return true; // If error, assume expired
    }
  }

  getUserFromToken(): { userid?: string; username?: string } | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        return null;
      }

      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return null;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
      
      const payload = JSON.parse(atob(paddedBase64));

      const result = {
        userid: payload.user_id || payload.userid || payload.id,
        username: payload.username || payload.user || payload.name,
      };
      
      return result;
    } catch (err) {
      console.error('❌ [API] Error parsing JWT token:', err);
      return null;
    }
  }
}

export const apiClient = new ApiClient();
