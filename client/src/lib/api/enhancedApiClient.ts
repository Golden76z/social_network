/**
 * Enhanced API Client with better error handling
 * 
 * This client provides better error handling for empty responses
 * and more detailed debugging information.
 */

export class EnhancedApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Enhanced request method with better error handling
   */
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    
    // Log request details
    console.log('🌐 Enhanced API request:', fullUrl);
    console.log('📋 Request options:', {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? 'Present' : 'None'
    });

    try {
      const response = await fetch(fullUrl, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers,
        },
      });

      // Log response details
      console.log('📡 Response status:', response.status);
      console.log('📡 Response statusText:', response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        await this.handleErrorResponse(response, fullUrl);
      }

      // Try to parse JSON response
      try {
        const data = await response.json();
        console.log('✅ Response data:', data);
        return data;
      } catch (jsonError) {
        // If JSON parsing fails, try to get text
        const text = await response.text();
        console.log('📄 Response text:', text);
        
        if (text) {
          return text as unknown as T;
        } else {
          console.warn('⚠️ Empty response body');
          return null as T;
        }
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      throw error;
    }
  }

  /**
   * Enhanced error handling for failed responses
   */
  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    let errorMessage = '';
    let rawResponse = '';

    try {
      rawResponse = await response.text();
      console.log('📄 Error response body:', rawResponse);
    } catch (textError) {
      console.warn('⚠️ Could not read error response body:', textError);
    }

    // Determine error message based on response content and status
    if (rawResponse) {
      errorMessage = rawResponse;
    } else {
      // Provide meaningful error messages for empty responses
      errorMessage = this.getDefaultErrorMessage(response.status, response.statusText);
    }

    // Log comprehensive error information
    console.error('❌ Enhanced API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      rawResponse: rawResponse,
      headers: Object.fromEntries(response.headers.entries()),
      errorMessage: errorMessage,
      timestamp: new Date().toISOString()
    });

    throw new Error(errorMessage.trim());
  }

  /**
   * Get default error message for empty responses
   */
  private getDefaultErrorMessage(status: number, statusText: string): string {
    const statusMessages: Record<number, string> = {
      400: 'Bad Request - Invalid request format',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Access denied',
      404: 'Not Found - Resource does not exist',
      405: 'Method Not Allowed - Invalid HTTP method',
      408: 'Request Timeout - Server took too long to respond',
      409: 'Conflict - Resource conflict',
      422: 'Unprocessable Entity - Invalid data',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server encountered an error',
      502: 'Bad Gateway - Server is temporarily unavailable',
      503: 'Service Unavailable - Server is temporarily down',
      504: 'Gateway Timeout - Server took too long to respond',
    };

    return statusMessages[status] || `API Error: ${status} ${statusText}`;
  }

  /**
   * GET request
   */
  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request with CSRF token handling
   */
  async post<T>(url: string, data?: any): Promise<T> {
    // Get CSRF token if needed
    if (!this.csrfToken) {
      await this.fetchCSRFToken();
    }

    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {},
    });
  }

  /**
   * PUT request with CSRF token handling
   */
  async put<T>(url: string, data?: any): Promise<T> {
    if (!this.csrfToken) {
      await this.fetchCSRFToken();
    }

    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {},
    });
  }

  /**
   * DELETE request with CSRF token handling
   */
  async delete<T>(url: string): Promise<T> {
    if (!this.csrfToken) {
      await this.fetchCSRFToken();
    }

    return this.request<T>(url, {
      method: 'DELETE',
      headers: this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {},
    });
  }

  /**
   * Fetch CSRF token
   */
  private async fetchCSRFToken(): Promise<void> {
    try {
      console.log('🔐 Fetching CSRF token...');
      const response = await fetch(`${this.baseUrl}/api/post`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const token = response.headers.get('X-CSRF-Token');
      if (token) {
        this.csrfToken = token;
        console.log('🔐 CSRF token fetched successfully');
      } else {
        console.warn('⚠️ No CSRF token found in response headers');
      }
    } catch (error) {
      console.error('❌ Failed to fetch CSRF token:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getUserFromToken() !== null;
  }

  /**
   * Get user from JWT token
   */
  getUserFromToken(): { userid: string; username: string } | null {
    try {
      const cookies = document.cookie.split(';');
      const jwtCookie = cookies.find(cookie => cookie.trim().startsWith('jwt_token='));
      
      if (!jwtCookie) return null;
      
      const token = jwtCookie.split('=')[1];
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      return {
        userid: decoded.userid || decoded.id,
        username: decoded.username || decoded.user,
      };
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const enhancedApiClient = new EnhancedApiClient('http://localhost:8080');
