const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Auth token management
export const AuthToken = {
  get: () => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('auth_token', token);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  remove: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // Silently fail if localStorage is not available
    }
  }
};

export class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = AuthToken.get();
    
    console.log(`Making API request to: ${url}`);
    console.log('Request options:', options);
    console.log('Auth token exists:', !!token);
    
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
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('API response data:', result);
      return result;
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

  // Category methods
  static async getCategories() {
    return this.get('/categories/');
  }

  static async createCategory(categoryData: {
    name: string;
    description?: string;
  }) {
    return this.post('/categories/', categoryData);
  }

  static async updateCategory(categoryId: number, categoryData: {
    name?: string;
    description?: string;
    is_active?: boolean;
  }) {
    return this.put(`/categories/${categoryId}/`, categoryData);
  }

  static async deleteCategory(categoryId: number) {
    return this.delete(`/categories/${categoryId}/`);
  }

  static async toggleCategory(categoryId: number) {
    return this.put(`/categories/${categoryId}/toggle/`, {});
  }

  // Settings methods
  static async getSettings() {
    return this.get('/auth/settings/');
  }

  static async updateSettings(settingsData: {
    language?: string;
    currency?: string;
    email_notifications?: boolean;
    marketing_notifications?: boolean;
  }) {
    return this.put('/auth/settings/', settingsData);
  }

  static async changePassword(passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    return this.post('/auth/change-password/', passwordData);
  }

  static async requestPasswordReset() {
    return this.post('/auth/request-password-reset/', {});
  }

  // Gift methods
  static async getGifts() {
    return this.get('/gifts/');
  }

  static async createGift(giftData: {
    name: string;
    is_active?: boolean;
  }) {
    return this.post('/gifts/', giftData);
  }

  static async updateGift(giftId: number, giftData: {
    name?: string;
    is_active?: boolean;
  }) {
    return this.put(`/gifts/${giftId}/`, giftData);
  }

  static async deleteGift(giftId: number) {
    return this.delete(`/gifts/${giftId}/`);
  }

  static async toggleGift(giftId: number) {
    return this.put(`/gifts/${giftId}/toggle/`, {});
  }

  // Achievement methods
  static async getAchievements() {
    return this.get('/achievements/');
  }

  static async createAchievement(achievementData: {
    name?: string;
    type: 'orders' | 'amount';
    value: number;
    points: number;
    is_active?: boolean;
  }) {
    return this.post('/achievements/', achievementData);
  }

  static async updateAchievement(achievementId: number, achievementData: {
    name?: string;
    type?: 'orders' | 'amount';
    value?: number;
    points?: number;
    is_active?: boolean;
  }) {
    return this.put(`/achievements/${achievementId}/`, achievementData);
  }

  static async deleteAchievement(achievementId: number) {
    return this.delete(`/achievements/${achievementId}/`);
  }

  static async toggleAchievement(achievementId: number) {
    return this.put(`/achievements/${achievementId}/toggle/`, {});
  }

  // Level methods
  static async getLevels() {
    return this.get('/levels/');
  }

  static async createLevel(levelData: {
    name: string;
    is_active?: boolean;
  }) {
    return this.post('/levels/', levelData);
  }

  static async updateLevel(levelId: number, levelData: {
    name?: string;
    is_active?: boolean;
  }) {
    return this.put(`/levels/${levelId}/`, levelData);
  }

  static async deleteLevel(levelId: number) {
    return this.delete(`/levels/${levelId}/`);
  }

  static async toggleLevel(levelId: number) {
    return this.put(`/levels/${levelId}/toggle/`, {});
  }

  // Suppliers methods
  static async getSuppliers() {
    return this.get('/suppliers/');
  }

  static async createSupplier(supplierData: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    contact_person?: string;
    notes?: string;
  }) {
    return this.post('/suppliers/', supplierData);
  }

  static async updateSupplier(id: number, supplierData: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    contact_person?: string;
    notes?: string;
  }) {
    return this.put(`/suppliers/${id}/`, supplierData);
  }

  static async deleteSupplier(id: number) {
    return this.delete(`/suppliers/${id}/`);
  }

  static async activateSupplier(id: number) {
    return this.post(`/suppliers/${id}/activate/`, {});
  }

  static async deactivateSupplier(id: number) {
    return this.post(`/suppliers/${id}/deactivate/`, {});
  }

  // Purchase methods
  static async getPurchases() {
    console.log('ApiService.getPurchases() called');
    try {
      const result = await this.get('/purchases/');
      console.log('Purchases API response:', result);
      return result;
    } catch (error) {
      console.error('Error in getPurchases:', error);
      throw error;
    }
  }

  static async createPurchase(purchaseData: {
    supplier: number;
    date: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    products: string;
    notes?: string;
    proof_document?: File;
  }) {
    const formData = new FormData();
    formData.append('supplier', purchaseData.supplier.toString());
    formData.append('date', purchaseData.date);
    formData.append('amount', purchaseData.amount.toString());
    formData.append('status', purchaseData.status);
    formData.append('products', purchaseData.products);
    
    if (purchaseData.notes) {
      formData.append('notes', purchaseData.notes);
    }
    
    if (purchaseData.proof_document) {
      formData.append('proof_document', purchaseData.proof_document);
    }

    return this.request('/purchases/', {
      method: 'POST',
      body: formData,
    });
  }

  static async updatePurchase(id: number, purchaseData: {
    supplier?: number;
    date?: string;
    amount?: number;
    status?: 'pending' | 'completed' | 'cancelled';
    products?: string;
    notes?: string;
    proof_document?: File;
  }) {
    const formData = new FormData();
    
    if (purchaseData.supplier) {
      formData.append('supplier', purchaseData.supplier.toString());
    }
    if (purchaseData.date) {
      formData.append('date', purchaseData.date);
    }
    if (purchaseData.amount) {
      formData.append('amount', purchaseData.amount.toString());
    }
    if (purchaseData.status) {
      formData.append('status', purchaseData.status);
    }
    if (purchaseData.products) {
      formData.append('products', purchaseData.products);
    }
    if (purchaseData.notes) {
      formData.append('notes', purchaseData.notes);
    }
    if (purchaseData.proof_document) {
      formData.append('proof_document', purchaseData.proof_document);
    }

    return this.request(`/purchases/${id}/`, {
      method: 'PUT',
      body: formData,
    });
  }

  static async deletePurchase(id: number) {
    return this.delete(`/purchases/${id}/`);
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
