// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

// ==================== DEV MODE CONFIGURATION ====================
// When DEV_MODE is enabled, API calls skip authentication
// Backend routes are made public for testing
const DEV_MODE = false;
// ==================== END DEV MODE CONFIGURATION ====================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get auth token from localStorage (fallback during migration)
   * Note: httpOnly cookies are sent automatically via credentials: 'include'
   * This fallback will be removed once migration is complete.
   */
  private getAuthTokenFallback(): string | null {
    if (DEV_MODE) return null;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;

    // Append query parameters
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Fallback token from localStorage (will be removed after full migration)
    const fallbackToken = this.getAuthTokenFallback();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Only add Authorization header if fallback token exists
    // httpOnly cookie is sent automatically via credentials: 'include'
    if (fallbackToken) {
      headers['Authorization'] = `Bearer ${fallbackToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Sends httpOnly cookies automatically
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized (keep token so user isn't silently logged out)
      if (response.status === 401) {
        console.warn('401 Unauthorized - Authentication required');
        return {
          data: undefined,
          error: 'Unauthorized',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        console.error(`API Error [${response.status}]:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return {
          error: errorMessage,
        };
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: undefined as T };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async postFormData<T>(endpoint: string, formData: FormData, options?: { params?: Record<string, any>; headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const { headers, ...rest } = options || {};
    return this.request<T>(endpoint, {
      ...rest,
      method: 'POST',
      body: formData,
      headers: {
        // Omitting Content-Type lets the browser set it with the correct boundary for FormData
        ...headers,
      } as Record<string, string>,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
