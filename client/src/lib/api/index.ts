const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8080';

export class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    // Get CSRF token if we don't have one and this is a state-changing request
    if (!this.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
      await this.fetchCSRFToken();
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(this.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET') 
        ? { 'X-CSRF-Token': this.csrfToken } 
        : {}),
      ...options.headers,
    };

    console.log('🌐 API request:', url);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

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
      throw new Error(message.trim());
    }

    return response.json();
  }

  private async fetchCSRFToken(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/posts`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const token = response.headers.get('X-CSRF-Token');
      if (token) {
        this.csrfToken = token;
        console.log('🔐 CSRF token fetched:', token.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
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

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  isAuthenticated(): boolean {
    if (typeof document === 'undefined') return false;
    return document.cookie.includes('jwt_token=');
  }

  getUserFromToken(): { userid?: string; username?: string } | null {
    if (typeof document === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      const jwtCookie = cookies.find(c => c.trim().startsWith('jwt_token='));
      if (!jwtCookie) return null;

      const token = jwtCookie.split('=')[1];
      if (!token) return null;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));

      return {
        userid: payload.userid || payload.id || payload.user_id,
        username: payload.username || payload.user || payload.name,
      };
    } catch (err) {
      console.error('Error decoding JWT:', err);
      return null;
    }
  }
}

export const apiClient = new ApiClient();