const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Token ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
    return this.request('/health/', { method: 'GET', headers: {} }); // No auth needed
  }

  static async getApiRoot() {
    return this.request('/', { method: 'GET', headers: {} }); // No auth needed
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
      headers: {}
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
      headers: {}
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

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!AuthToken.get();
  }
}
