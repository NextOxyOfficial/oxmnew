const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Auth token management
export const AuthToken = {
  get: () => typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  set: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },
  remove: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
};

export class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = AuthToken.get();
    
    const headers: HeadersInit = {};
    
    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    
    // Add custom headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Only add Authorization header if token exists and not explicitly disabled
    const skipAuth = options.headers && 'Authorization' in options.headers && (options.headers as any)['Authorization'] === null;
    if (token && !skipAuth) {
      (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  static async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  static async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // General API methods
  static async healthCheck() {
    return this.request('/health/', { 
      method: 'GET',
      headers: { 'Authorization': null } as any // No auth needed
    });
  }

  static async getApiRoot() {
    return this.request('/', { 
      method: 'GET',
      headers: { 'Authorization': null } as any // No auth needed
    });
  }

  // Authentication methods
  static async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) {
    const response = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      AuthToken.set(response.token);
    }
    
    return response;
  }

  static async login(credentials: { username: string; password: string }) {
    const response = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      AuthToken.set(response.token);
    }
    
    return response;
  }

  static async logout() {
    try {
      await this.post('/auth/logout/', {});
    } finally {
      AuthToken.remove();
    }
  }

  static async getProfile() {
    return this.get('/auth/profile/');
  }

  static async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    company?: string;
    company_address?: string;
    phone?: string;
  }) {
    return this.put('/auth/profile/', profileData);
  }

  static async uploadStoreLogo(file: File) {
    const formData = new FormData();
    formData.append('store_logo', file);
    
    return this.request('/auth/profile/upload-logo/', {
      method: 'POST',
      body: formData,
    });
  }

  static async uploadBannerImage(file: File) {
    const formData = new FormData();
    formData.append('banner_image', file);
    
    return this.request('/auth/profile/upload-banner/', {
      method: 'POST',
      body: formData,
    });
  }

  static async removeStoreLogo() {
    return this.delete('/auth/profile/remove-logo/');
  }

  static async removeBannerImage() {
    return this.delete('/auth/profile/remove-banner/');
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!AuthToken.get();
  }

  // Helper to get full URL for images
  static getImageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${BACKEND_BASE_URL}${relativePath}`;
  }
}
