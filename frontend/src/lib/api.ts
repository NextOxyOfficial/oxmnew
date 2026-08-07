import type { PaginatedTransactions, Transaction } from "@/types/banking";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Helper function to determine if we're in production
const isProduction = () => {
  const nodeEnvProduction = process.env.NODE_ENV === 'production';
  const notLocalhost = typeof window !== 'undefined' && 
         !window.location.hostname.includes('localhost') &&
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('dev');
  
  const result = nodeEnvProduction || notLocalhost;
  
  return result;
};

// Get the production backend URL based on current domain
const getProductionBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // If we have environment variable, use it in production
    if (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL !== "http://localhost:8000") {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    
    // Fallback to current domain
    const url = `${window.location.protocol}//${window.location.hostname}${window.location.port && window.location.port !== '80' && window.location.port !== '443' ? ':' + window.location.port : ''}`;
    
    return url;
  }
  return BACKEND_BASE_URL;
};

// Get the API URL for requests
export const getApiUrl = () => {
  if (isProduction()) {
    // In production, prefer environment variable, fallback to dynamic
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== "http://localhost:8000/api") {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    const backendUrl = getProductionBackendUrl();
    const apiUrl = `${backendUrl}/api`;
    return apiUrl;
  }
  
  return API_BASE_URL;
};

// Product interfaces
interface ProductVariant {
  id?: number;
  color: string;
  size: string;
  weight?: number;
  weight_unit?: string;
  custom_variant?: string;
  buy_price: number;
  sell_price: number;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  category?: number;
  supplier?: number;
  location?: string;
  details?: string;
  has_variants: boolean;
  buy_price: number;
  sell_price: number;
  stock: number;
  variants?: ProductVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Additional interfaces for other entities
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  supplier: number;
  supplier_name?: string;
  total_amount: number;
  items: Array<{
    product: number;
    product_name?: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  customer: number;
  customer_name?: string;
  order_number: string;
  status:
    | "draft"
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refunded";
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  discount_amount: number;
  tax_amount: number;
  notes?: string;
  delivery_address?: string;
  expected_delivery_date?: string;
  items_count: number;
  items?: Array<{
    id: number;
    product: number;
    product_name?: string;
    variant?: number;
    variant_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  created_at: string;
  updated_at: string;
}

// Auth token management
export const AuthToken = {
  get: () => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("auth_token");
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("auth_token", token);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  remove: () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("auth_token");
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};

// API Key interfaces
interface APIKey {
  id: number;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used: string | null;
  requests_per_hour: number;
  requests_per_day: number;
}

interface APIKeyUsageLog {
  id: number;
  api_key: number;
  endpoint: string;
  ip_address: string;
  user_agent: string;
  response_status: number;
  response_time_ms: number | null;
  timestamp: string;
}

interface APIKeyUsageStats {
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used: string | null;
  rate_limits: {
    requests_per_hour: number;
    requests_per_day: number;
  };
  stats_last_30_days: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
  };
  daily_usage_last_7_days: Array<{
    date: string;
    requests: number;
  }>;
}

export class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    // Use centralized API URL function
    const apiUrl = getApiUrl();
    const url = `${apiUrl}${endpoint}`;
    const token = AuthToken.get();

    // Always log API requests for debugging upload issues
    const headers: HeadersInit = {};

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    // Add custom headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Only add Authorization header if token exists and not explicitly disabled
    const skipAuth =
      options.headers &&
      "Authorization" in options.headers &&
      (options.headers as Record<string, unknown>)["Authorization"] === null;
    if (token && !skipAuth) {
      (headers as Record<string, string>)["Authorization"] = `Token ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = null;

        // Get response text first to check if it's HTML or JSON
  const responseText = await response.text();
  // 402 is a business condition, not a fault — the caller shows the user how
  // to fix it, so logging it only adds noise to the console.
  if (response.status !== 402) {
    console.warn(`API Error Response (${response.status}):`, responseText);
  }

        try {
          const errorData = JSON.parse(responseText);
          errorDetails = errorData;
          errorMessage = errorData.error || errorData.detail || errorMessage;

          // If it's a validation error, show field-specific errors
          if (response.status === 400 && errorData) {
            const fieldErrors = [];
            for (const [field, errors] of Object.entries(errorData)) {
              if (Array.isArray(errors)) {
                fieldErrors.push(`${field}: ${errors.join(", ")}`);
              } else if (typeof errors === "string") {
                fieldErrors.push(`${field}: ${errors}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join("; ");
            }
          }
        } catch {
          // Response is not JSON, probably HTML error page
          console.error("Response is not JSON, likely HTML error page");
          if (
            responseText.includes("<html>") ||
            responseText.includes("<!DOCTYPE")
          ) {
            errorMessage = `Server returned HTML instead of JSON (${response.status}). Check if the backend endpoint exists and is properly configured.`;
          } else {
            errorMessage = `${response.status} ${
              response.statusText
            }: ${responseText.substring(0, 200)}`;
          }
        }

        const error = new Error(errorMessage);
        (error as Error & { details?: unknown }).details = errorDetails;
        throw error;
      }

      // Handle 204 No Content responses (like DELETE operations)
      if (response.status === 204) {
        return null;
      }

      // Get response text first to check if it's valid JSON
      const responseText = await response.text();
      try {
        const result = JSON.parse(responseText);
        return result;
      } catch {
        console.error("Failed to parse JSON response:", responseText);
        throw new Error(
          `Server returned invalid JSON. Response: ${responseText.substring(
            0,
            200
          )}`
        );
      }
    } catch (error) {
      console.error("API request failed:", error);
      console.error("Request URL:", url);
      console.error("Request config:", config);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the backend is running."
        );
      }
      throw error;
    }
  }

  static async get(endpoint: string, signal?: AbortSignal) {
    return this.request(endpoint, { method: "GET", signal });
  }

  static async post(endpoint: string, data: unknown) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint: string, data: unknown) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async patch(endpoint: string, data: unknown) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint: string) {
    return this.request(endpoint, { method: "DELETE" });
  }

  static async postFormData(endpoint: string, formData: FormData) {
    return this.request(endpoint, {
      method: "POST",
      body: formData,
      // Don't set Content-Type or Authorization headers, they will be handled by the request method
    });
  }

  // General API methods
  static async healthCheck() {
    return this.request("/health/", {
      method: "GET",
      headers: { Authorization: null as unknown as string }, // No auth needed
    });
  }

  static async getApiRoot() {
    return this.request("/", {
      method: "GET",
      headers: { Authorization: null as unknown as string }, // No auth needed
    });
  }

  // Authentication methods
  static async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    // Profile fields
    company?: string;
    phone?: string;
    address?: string;
    city?: string;
    post_code?: string;
  }) {
    const response = await this.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.token) {
      AuthToken.set(response.token);
    }

    return response;
  }

  static async login(credentials: { username: string; password: string }) {
    const response = await this.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      AuthToken.set(response.token);
    }

    return response;
  }

  static async logout() {
    try {
      await this.post("/auth/logout/", {});
    } finally {
      AuthToken.remove();
    }
  }

  static async getProfile() {
    return this.get("/auth/profile/");
  }

  static async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    company?: string;
    company_address?: string;
    phone?: string;
    contact_number?: string;
    address?: string;
    city?: string;
    post_code?: string;
  }) {
    return this.put("/auth/profile/", profileData);
  }

  static async uploadStoreLogo(file: File) {
    const formData = new FormData();
    formData.append("store_logo", file);

    try {
      const response = await this.request("/auth/profile/upload-logo/", {
        method: "POST",
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('Store logo upload failed:', error);
      throw error;
    }
  }

  static async uploadBannerImage(file: File) {
    const formData = new FormData();
    formData.append("banner_image", file);

    try {
      const response = await this.request("/auth/profile/upload-banner/", {
        method: "POST",
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('Banner image upload failed:', error);
      throw error;
    }
  }

  static async removeStoreLogo() {
    return this.delete("/auth/profile/remove-logo/");
  }

  static async removeBannerImage() {
    return this.delete("/auth/profile/remove-banner/");
  }

  // Employee methods
  static async getEmployees(page?: number) {
    try {
      const url = page ? `/employees/?page=${page}` : "/employees/";
      const result = await this.get(url);

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected employees response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getEmployee(id: number) {
    return this.get(`/employees/${id}/`);
  }

  static async createEmployee(employeeData: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    salary?: number;
    hire_date?: string;
    photo?: File;
  }) {
    if (employeeData.photo) {
      const formData = new FormData();
      Object.entries(employeeData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "photo" && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return this.request("/employees/", {
        method: "POST",
        body: formData,
      });
    } else {
      // Remove photo from data if it's undefined
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photo, ...dataWithoutPhoto } = employeeData;
      return this.post("/employees/", dataWithoutPhoto);
    }
  }

  static async updateEmployee(
    id: number,
    employeeData: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      position?: string;
      department?: string;
      salary?: number;
      hire_date?: string;
      status?: string;
      photo?: File;
    }
  ) {
    if (employeeData.photo) {
      const formData = new FormData();
      Object.entries(employeeData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "photo" && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return this.request(`/employees/${id}/`, {
        method: "PATCH",
        body: formData,
      });
    } else {
      // Remove photo from data if it's undefined
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photo, ...dataWithoutPhoto } = employeeData;
      return this.patch(`/employees/${id}/`, dataWithoutPhoto);
    }
  }

  static async deleteEmployee(id: number) {
    return this.delete(`/employees/${id}/`);
  }

  // Incentive methods
  static async getIncentives(params?: { page?: number; employee?: number; page_size?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.employee) queryParams.append('employee', params.employee.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const url = queryParams.toString() ? `/incentives/?${queryParams.toString()}` : '/incentives/';
    return this.get(url);
  }

  static async createIncentive(incentiveData: {
    employee: number;
    title: string;
    description?: string;
    amount: number;
    type: "bonus" | "commission" | "achievement" | "performance";
    status?: "pending" | "approved" | "paid";
  }) {
    return this.post("/incentives/", incentiveData);
  }

  static async withdrawFromEmployee(employeeId: number, withdrawalData: {
    amount: number;
    reason?: string;
  }) {
    return this.post(`/incentives/withdraw-from-employee/${employeeId}/`, withdrawalData);
  }

  static async getWithdrawalHistory(employeeId?: number, params?: { page?: number; page_size?: number }) {
    const queryParams = new URLSearchParams();
    if (employeeId) queryParams.append('employee', employeeId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const url = queryParams.toString() ? `/incentive-withdrawals/?${queryParams.toString()}` : '/incentive-withdrawals/';
    return this.get(url);
  }

  // Banking methods
  static async getBankAccounts() {
    // Try the my_accounts endpoint first, fallback to regular accounts
    try {
      return this.get("/banking/accounts/my_accounts/");
    } catch (error) {
      return this.get("/banking/accounts/");
    }
  }

  static async createBankAccount(accountData: {
    name: string;
    account_number?: string;
    balance?: number;
    is_active?: boolean;
  }) {
    try {
      const response = await this.post("/banking/accounts/", {
        ...accountData,
        balance: accountData.balance || 0,
        is_active: accountData.is_active !== undefined ? accountData.is_active : true,
      });
      return response;
    } catch (error: any) {
      console.error("Failed to create bank account:", error);
      throw error;
    }
  }

  static async updateBankAccount(
    accountId: string,
    accountData: {
      name?: string;
      balance?: number;
    }
  ) {
    return this.patch(`/banking/accounts/${accountId}/`, accountData);
  }

  static async deleteBankAccount(accountId: string) {
    return this.delete(`/banking/accounts/${accountId}/`);
  }

  static async getAccountTransactions(
    accountId: string,
    filters?: Record<string, string>
  ): Promise<PaginatedTransactions | Transaction[]> {
    // Build filtered params without 'all' placeholders
    const buildParams = (base?: Record<string, string>) => {
      const params = new URLSearchParams();
      if (!base) return params;
      Object.entries(base).forEach(([key, value]) => {
        if (!value) return;
        if (value === "all") return;
        params.append(key, value);
      });
      return params;
    };

    // Use the nested endpoint with proper date filtering support
    let endpoint = `/banking/accounts/${accountId}/transactions/`;
    const queryParams = buildParams(filters);
    const queryString = queryParams.toString();
    endpoint = `${endpoint}${queryString ? `?${queryString}` : ""}`;
    
    const response = await this.get(endpoint);
    if (response && typeof response === 'object' && 'results' in response) {
      return response as PaginatedTransactions;
    }
    return Array.isArray(response) ? response : [];
  }

  static async createTransaction(transactionData: {
    account: string;
    type: "debit" | "credit";
    amount: number;
    purpose: string;
    verified_by: string | null;
    status?: string;
  }) {
    return this.post("/banking/transactions/", {
      ...transactionData,
      status: transactionData.status || "verified",
    });
  }

  static async getAccountSummary(accountId: string) {
    return this.get(`/banking/accounts/${accountId}/summary/`);
  }

  static async getDashboardStats(accountId?: string) {
    const queryParams = accountId ? `?account_id=${accountId}` : "";
    return this.get(`/banking/transactions/dashboard_stats/${queryParams}`);
  }

  static async exportTransactionsXLSX(filters?: Record<string, string>) {
    // Build filtered params without 'all' placeholders
    const buildParams = (base?: Record<string, string>) => {
      const params = new URLSearchParams();
      if (!base) return params;
      Object.entries(base).forEach(([key, value]) => {
        if (!value) return;
        if (value === "all") return;
        params.append(key, value);
      });
      return params;
    };

    const params = buildParams(filters);
    const queryString = params.toString();
    const endpoint = `/banking/transactions/export_xlsx/${queryString ? `?${queryString}` : ""}`;
    
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${AuthToken.get()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export transactions");
    }

    return response.blob();
  }

  // Categories methods
  static async getCategories() {
    try {
      const result = await this.get("/categories/");

      // Handle the specific backend response format: {"categories": [...]}
      if (result && result.categories && Array.isArray(result.categories)) {
        return result.categories;
      }
      // Handle paginated response
      else if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected categories response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createCategory(categoryData: {
    name: string;
    description?: string;
  }) {
    return this.post("/categories/", categoryData);
  }

  static async updateCategory(
    categoryId: number,
    categoryData: {
      name?: string;
      description?: string;
      is_active?: boolean;
    }
  ) {
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
    return this.get("/auth/settings/");
  }

  static async updateSettings(settingsData: {
    language?: string;
    currency?: string;
    email_notifications?: boolean;
    marketing_notifications?: boolean;
  }) {
    return this.put("/auth/settings/", settingsData);
  }

  static async changePassword(passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    return this.post("/auth/change-password/", passwordData);
  }

  // Gift methods
  static async getGifts() {
    try {
      const result = await this.get("/gifts/");

      // Handle the specific backend response format: {"gifts": [...]}
      if (result && result.gifts && Array.isArray(result.gifts)) {
        return result.gifts;
      }
      // Handle paginated response
      else if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected gifts response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching gifts:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createGift(giftData: { name: string; is_active?: boolean }) {
    return this.post("/gifts/", giftData);
  }

  static async updateGift(
    giftId: number,
    giftData: {
      name?: string;
      is_active?: boolean;
    }
  ) {
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
    try {
      const result = await this.get("/achievements/");

      // Handle the specific backend response format: {"achievements": [...]}
      if (result && result.achievements && Array.isArray(result.achievements)) {
        return result.achievements;
      }
      // Handle paginated response
      else if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected achievements response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createAchievement(achievementData: {
    name?: string;
    type: "orders" | "amount";
    value: number;
    points: number;
    is_active?: boolean;
  }) {
    return this.post("/achievements/", achievementData);
  }

  static async updateAchievement(
    achievementId: number,
    achievementData: {
      name?: string;
      type?: "orders" | "amount";
      value?: number;
      points?: number;
      is_active?: boolean;
    }
  ) {
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
    try {
      const result = await this.get("/levels/");

      // Handle the specific backend response format: {"levels": [...]}
      if (result && result.levels && Array.isArray(result.levels)) {
        return result.levels;
      }
      // Handle paginated response
      else if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected levels response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching levels:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createLevel(levelData: { name: string; is_active?: boolean }) {
    return this.post("/levels/", levelData);
  }

  static async updateLevel(
    levelId: number,
    levelData: {
      name?: string;
      is_active?: boolean;
    }
  ) {
    return this.put(`/levels/${levelId}/`, levelData);
  }

  static async deleteLevel(levelId: number) {
    return this.delete(`/levels/${levelId}/`);
  }

  static async toggleLevel(levelId: number) {
    return this.put(`/levels/${levelId}/toggle/`, {});
  }

  // Brand methods
  static async getBrands() {
    try {
      const result = await this.get("/brands/");

      // Handle the specific backend response format: {"brands": [...]}
      if (result && result.brands && Array.isArray(result.brands)) {
        return result.brands;
      }
      // Handle paginated response
      else if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected brands response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createBrand(brandData: { name: string; is_active?: boolean }) {
    return this.post("/brands/", brandData);
  }

  static async updateBrand(
    brandId: number,
    brandData: {
      name?: string;
      is_active?: boolean;
    }
  ) {
    return this.put(`/brands/${brandId}/`, brandData);
  }

  static async deleteBrand(brandId: number) {
    return this.delete(`/brands/${brandId}/`);
  }

  static async toggleBrand(brandId: number) {
    return this.put(`/brands/${brandId}/toggle/`, {});
  }

  // Payment Method methods
  static async getPaymentMethods() {
    try {
      const result = await this.get("/payment-methods/");

      // Handle the specific backend response format: {"paymentMethods": [...]}
      if (
        result &&
        result.paymentMethods &&
        Array.isArray(result.paymentMethods)
      ) {
        return result.paymentMethods;
      }
      // Handle paginated response
      else if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected payment methods response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createPaymentMethod(paymentMethodData: {
    name: string;
    is_active?: boolean;
  }) {
    return this.post("/payment-methods/", paymentMethodData);
  }

  static async updatePaymentMethod(
    paymentMethodId: number,
    paymentMethodData: {
      name?: string;
      is_active?: boolean;
    }
  ) {
    return this.put(`/payment-methods/${paymentMethodId}/`, paymentMethodData);
  }

  static async deletePaymentMethod(paymentMethodId: number) {
    return this.delete(`/payment-methods/${paymentMethodId}/`);
  }

  static async togglePaymentMethod(paymentMethodId: number) {
    return this.put(`/payment-methods/${paymentMethodId}/toggle/`, {});
  }

  // Suppliers methods
  /** `pageSize` matters for dropdowns — without it only the first page (10) arrives. */
  static async getSuppliers(page?: number, pageSize?: number) {
    try {
      const url = `/suppliers/${this.buildQuery({ page, page_size: pageSize })}`;
      const result = await this.get(url);

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected suppliers response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return []; // Return empty array instead of throwing
    }
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
    return this.post("/suppliers/", supplierData);
  }

  static async updateSupplier(
    id: number,
    supplierData: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      contact_person?: string;
      notes?: string;
    }
  ) {
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

  // Products methods
  static async getProducts(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: number | string;
    supplier?: number | string;
    ordering?: string;
  }) {
    let endpoint = "/products/";

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      endpoint += `?${searchParams.toString()}`;
    }

    const result = await this.get(endpoint);
    return result;
  }

  static async searchProducts(query: string, signal?: AbortSignal) {
    if (!query || query.trim().length < 1) {
      return [];
    }
    
    try {
      const response = await this.get(
        `/products/fast-search/?q=${encodeURIComponent(query.trim())}&limit=20`,
        signal
      );
      
      if (signal?.aborted) {
        throw new Error('AbortError');
      }
      
      if (response && response.results && Array.isArray(response.results)) {
        return response.results;
      } else if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      if (error instanceof Error && (error.message === 'Request aborted' || error.name === 'AbortError' || error.message === 'AbortError')) {
        throw new Error('AbortError');
      }
      console.error('API: Error in searchProducts:', error);
      return [];
    }
  }

  static async getProduct(id: number) {
    return this.get(`/products/${id}/`);
  }

  /**
   * Creates a product, then uploads its photos.
   *
   * Photos cannot ride along with the create call: `post()` JSON-encodes its
   * body, and a File serialises to `{}` — so photos passed here used to be
   * dropped silently. They go up separately through the multipart add_photos
   * endpoint once the product has an id.
   */
  static async createProduct(productData: {
    name: string;
    category?: number;
    supplier?: number;
    product_code?: string;
    location?: string;
    details?: string;
    has_variants: boolean;
    no_stock_required?: boolean;
    buy_price: number;
    sell_price: number;
    stock: number;
    variants?: ProductVariant[];
    is_active?: boolean;
    photos?: File[];
  }) {
    const { photos, ...rest } = productData;
    const product = await this.post("/products/", rest);

    if (photos?.length && product?.id) {
      try {
        await this.addProductPhotos(product.id, photos);
      } catch (error) {
        // The product itself exists; surface the photo failure without
        // pretending the whole create failed.
        console.error("Product created but photos failed to upload:", error);
        return { ...product, photo_upload_failed: true };
      }
    }
    return product;
  }

  static async updateProduct(id: number, productData: Partial<Product>) {
    return this.patch(`/products/${id}/`, productData);
  }

  static async deleteProduct(id: number) {
    return this.delete(`/products/${id}/`);
  }

  static async toggleProduct(id: number) {
    return this.put(`/products/${id}/toggle/`, {});
  }

  // ── Variants & photos of an existing product ──────────────────────────
  // These back the edit screen, which needs the same capabilities the add
  // screen has. The endpoints are the @action routes on ProductViewSet.

  static async addProductVariant(
    productId: number,
    variant: {
      color?: string;
      size?: string;
      weight?: number | null;
      weight_unit?: string | null;
      custom_variant?: string | null;
      buy_price: number;
      sell_price: number;
      stock: number;
    }
  ) {
    return this.post(`/products/${productId}/add_variant/`, variant);
  }

  static async updateProductVariant(
    productId: number,
    variantId: number,
    variant: Record<string, unknown>
  ) {
    return this.patch(`/products/${productId}/variants/${variantId}/`, variant);
  }

  static async deleteProductVariant(productId: number, variantId: number) {
    return this.delete(`/products/${productId}/variants/${variantId}/`);
  }

  static async addProductPhotos(productId: number, photos: File[]) {
    const formData = new FormData();
    photos.forEach((photo) => formData.append("photos", photo));
    return this.postFormData(`/products/${productId}/add_photos/`, formData);
  }

  static async deleteProductPhoto(productId: number, photoId: number) {
    return this.delete(`/products/${productId}/photos/${photoId}/`);
  }

  // Stock management methods
  static async adjustProductStock(
    productId: number,
    stockData: {
      quantity: number;
      reason: string;
      notes?: string;
      variant_id?: number;
      buy_price?: number;
      update_average_price?: boolean;
      new_average_buy_price?: number;
    }
  ) {
    return this.post(`/products/${productId}/adjust_stock/`, stockData);
  }

  static async getProductStockMovements(
    productId?: number,
    params?: { page?: number; page_size?: number }
  ) {
    let url = productId
      ? `/stock-movements/?product=${productId}`
      : "/stock-movements/";

    // Add pagination parameters if provided
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.page_size)
        searchParams.append("page_size", params.page_size.toString());

      const paramString = searchParams.toString();
      if (paramString) {
        url += (url.includes("?") ? "&" : "?") + paramString;
      }
    }

    return this.get(url);
  }

  static async deleteStockMovement(movementId: number) {
    return this.delete(`/stock-movements/${movementId}/`);
  }

  // CSV upload methods
  static async uploadProductsCSV(csvFile: File) {
    const formData = new FormData();
    formData.append("csv_file", csvFile);

    return this.request("/products/upload_csv/", {
      method: "POST",
      body: formData,
    });
  }

  static async downloadProductsCSVTemplate() {
    const response = await fetch(
      `${API_BASE_URL}/products/download_csv_template/`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${AuthToken.get()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download CSV template");
    }

    return response.blob();
  }

  static async downloadProductsExcelTemplate() {
    const response = await fetch(
      `${API_BASE_URL}/products/download_excel_template/`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${AuthToken.get()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download Excel template");
    }

    return response.blob();
  }

  // Low stock and inventory methods
  static async getLowStockProducts(threshold: number = 10) {
    // Get all products and filter for low stock
    const products = await this.get("/products/");
    const allProducts = products.results || products;

    const lowStockProducts = allProducts.filter((product: Product) => {
      if (product.has_variants) {
        // Check if any variant has low stock
        return product.variants?.some(
          (variant: ProductVariant) => variant.stock <= threshold
        );
      } else {
        return product.stock <= threshold && product.stock > 0;
      }
    });

    return {
      results: lowStockProducts,
    };
  }

  static async getOutOfStockProducts() {
    // Get all products and filter for out of stock
    const products = await this.get("/products/");
    const allProducts = products.results || products;

    const outOfStockProducts = allProducts.filter((product: Product) => {
      if (product.has_variants) {
        // Check if all variants are out of stock
        return product.variants?.every(
          (variant: ProductVariant) => variant.stock === 0
        );
      } else {
        return product.stock === 0;
      }
    });

    return {
      results: outOfStockProducts,
    };
  }

  // Customer methods
  /**
   * Always returns a plain array.
   *
   * Note the caller-supplied `page_size`: the list endpoint paginates at 10, so
   * a picker that needs every customer (e.g. choosing a buyer) must ask for a
   * bigger page or it silently offers only the first ten.
   */
  static async getCustomers(params?: { page?: number; page_size?: number; search?: string }) {
    try {
      const result = await this.get(`/customers/${this.buildQuery(params)}`);

      // Ensure we return an array
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else if (result && Array.isArray(result.results)) {
        return result.results;
      } else {
        console.warn("Unexpected customers response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getCustomer(id: number) {
    return this.get(`/customers/${id}/`);
  }

  static async createCustomer(customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    company?: string;
  }) {
    // Prepare the data for the backend
    const data: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      notes?: string;
    } = {
      name: customerData.name,
    };

    // Only include email if it exists and is not empty
    if (customerData.email && customerData.email.trim()) {
      data.email = customerData.email.trim();
    }

    // Only include phone if it exists and is not empty
    if (customerData.phone && customerData.phone.trim()) {
      data.phone = customerData.phone.trim();
    }

    // Include address if provided
    if (customerData.address && customerData.address.trim()) {
      data.address = customerData.address.trim();
    }

    // Combine notes and company into notes field
    let notes = "";
    if (customerData.company && customerData.company.trim()) {
      notes += `Company: ${customerData.company.trim()}`;
    }
    if (customerData.notes && customerData.notes.trim()) {
      if (notes) notes += "\n";
      notes += customerData.notes.trim();
    }
    if (notes) {
      data.notes = notes;
    }

    return this.post("/customers/", data);
  }

  static async updateCustomer(
    id: number,
    customerData: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      notes?: string;
    }
  ) {
    return this.put(`/customers/${id}/`, customerData);
  }

  static async deleteCustomer(id: number) {
    return this.delete(`/customers/${id}/`);
  }

  // Order methods
  static async getOrders() {
    try {
      const result = await this.get("/orders/");

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected orders response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getOrder(id: number) {
    return this.get(`/orders/${id}/`);
  }

  static async createOrder(orderData: {
    customer?: number;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    customer_company?: string;
    status?: string;
    discount_percentage?: number;
    vat_percentage?: number;
    due_amount?: number;
    previous_due?: number;
    apply_previous_due_to_total?: boolean;
    notes?: string;
    due_date?: string;
    employee?: number;
    incentive_amount?: number;
    items: {
      product: number;
      variant?: number;
      quantity: number;
      unit_price: number;
      buy_price?: number;
    }[];
    payments?: {
      method: string;
      amount: number;
      reference?: string;
      notes?: string;
    }[];
  }) {
    return this.post("/orders/", orderData);
  }

  static async updateOrder(id: number, orderData: Partial<Order>) {
    return this.put(`/orders/${id}/`, orderData);
  }

  static async updateOrderItem(
    orderId: number,
    itemId: number,
    itemData: { quantity?: number; unit_price?: number }
  ) {
    return this.patch(`/orders/${orderId}/items/${itemId}/`, itemData);
  }

  static async addOrderItem(
    orderId: number,
    itemData: {
      product: number;
      variant?: number;
      quantity: number;
      unit_price: number;
      buy_price?: number;
    }
  ) {
    return this.post(`/orders/${orderId}/items/`, itemData);
  }

  static async removeOrderItem(orderId: number, itemId: number) {
    return this.delete(`/orders/${orderId}/items/${itemId}/`);
  }

  static async deleteOrder(id: number) {
    return this.delete(`/orders/${id}/`);
  }

  // Product Sales methods
  static async getProductSales() {
    try {
      const result = await this.get("/sales/");

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected product sales response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching product sales:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getProductSalesWithPagination(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    customer?: string;
    ordering?: string;
    date_filter?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let endpoint = "/sales/";

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      endpoint += `?${searchParams.toString()}`;
    }

    return this.get(endpoint);
  }

  static async getProductSale(id: number) {
    return this.get(`/sales/${id}/`);
  }

  static async getOrderStats() {
    return this.get("/sales/stats/");
  }


  static async createProductSale(saleData: {
    product: number;
    variant?: number;
    quantity: number;
    unit_price: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    notes?: string;
  }) {
    return this.post("/sales/", saleData);
  }

  static async updateProductSale(
    id: number,
    saleData: Partial<{
      product: number;
      variant?: number;
      quantity: number;
      unit_price: number;
      customer_name?: string;
      customer_phone?: string;
      customer_email?: string;
      notes?: string;
    }>
  ) {
    return this.put(`/sales/${id}/`, saleData);
  }

  static async deleteProductSale(id: number) {
    return this.delete(`/sales/${id}/`);
  }

  // Purchase methods
  static async getPurchases() {
    try {
      const result = await this.get("/purchases/");

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected purchases response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createPurchase(purchaseData: {
    supplier: number;
    date?: string;
    amount?: number;
    status?: string;
    products?: string;
    notes?: string;
    proof_document?: File | string;
    items?: Array<{
      product: number;
      quantity: number;
      price: number;
    }>;
  }) {
    // If we have a file, use FormData for file upload
    if (purchaseData.proof_document instanceof File) {
      const formData = new FormData();
      formData.append('supplier', purchaseData.supplier.toString());
      if (purchaseData.date) formData.append('date', purchaseData.date);
      if (purchaseData.amount) formData.append('amount', purchaseData.amount.toString());
      if (purchaseData.status) formData.append('status', purchaseData.status);
      if (purchaseData.products) formData.append('products', purchaseData.products);
      if (purchaseData.notes) formData.append('notes', purchaseData.notes);
      formData.append('proof_document', purchaseData.proof_document);
      if (purchaseData.items) formData.append('items', JSON.stringify(purchaseData.items));

      return this.postFormData("/purchases/", formData);
    } else {
      return this.post("/purchases/", purchaseData);
    }
  }

  static async updatePurchase(
    id: number,
    purchaseData: Partial<{
      supplier: number;
      date?: string;
      amount?: number;
      status?: string;
      products?: string;
      notes?: string;
      proof_document?: string;
      items?: Array<{
        product: number;
        quantity: number;
        price: number;
      }>;
    }>
  ) {
    try {
      const result = await this.patch(`/purchases/${id}/`, purchaseData);
      return result;
    } catch (error) {
      console.error("Error updating purchase:", error);
      throw error;
    }
  }

  static async deletePurchase(id: number) {
    return this.delete(`/purchases/${id}/`);
  }

  // Payment methods
  static async getPayments() {
    try {
      const result = await this.get("/payments/");

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected payments response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async createPayment(paymentData: {
    supplier?: number;
    type?: string;
    amount: number;
    description?: string;
    date?: string;
    method?: string;
    status?: string;
    reference?: string;
    notes?: string;
    proof_document?: File | string;
  }) {
    // If we have a file, use FormData for file upload
    if (paymentData.proof_document instanceof File) {
      const formData = new FormData();
      if (paymentData.supplier) formData.append('supplier', paymentData.supplier.toString());
      if (paymentData.type) formData.append('type', paymentData.type);
      formData.append('amount', paymentData.amount.toString());
      if (paymentData.description) formData.append('description', paymentData.description);
      if (paymentData.date) formData.append('date', paymentData.date);
      if (paymentData.method) formData.append('method', paymentData.method);
      if (paymentData.status) formData.append('status', paymentData.status);
      if (paymentData.reference) formData.append('reference', paymentData.reference);
      if (paymentData.notes) formData.append('notes', paymentData.notes);
      formData.append('proof_document', paymentData.proof_document);

      return this.postFormData("/payments/", formData);
    } else {
      return this.post("/payments/", paymentData);
    }
  }

  static async updatePayment(
    id: number,
    paymentData: Partial<{
      supplier?: number;
      type?: string;
      amount: number;
      description?: string;
      date?: string;
      method?: string;
      status?: string;
      reference?: string;
      notes?: string;
      proof_document?: string;
    }>
  ) {
    try {
      const result = await this.patch(`/payments/${id}/`, paymentData);
      return result;
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  }

  static async deletePayment(id: number) {
    return this.delete(`/payments/${id}/`);
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!AuthToken.get();
  }

  // Helper to get full URL for images
  static getImageUrl(relativePath: string): string {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;

    // Ensure the path starts with a slash
    const cleanPath = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;

    // Use dynamic backend URL for production
    const backendUrl = isProduction() ? getProductionBackendUrl() : BACKEND_BASE_URL;
    const fullUrl = `${backendUrl}${cleanPath}`;

    // Add cache-busting parameter for better image refreshing
    const timestamp = Date.now();
    const urlWithCacheBust = `${fullUrl}?t=${timestamp}`;

    return urlWithCacheBust;
  }

  static async sendSmsNotification(phone: string, message: string) {
    const data = { phone, message };
    return this.post("/send-sms/", data);
  }

  // Subscription API methods
  static async getSubscriptionPlans() {
    try {
      const result = await this.get("/plans/");

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected subscription plans response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getSmsPackages() {
    try {
      const result = await this.get("/sms-packages/");

      // Handle paginated response
      if (result && result.results && Array.isArray(result.results)) {
        return result.results;
      }
      // Ensure we return an array
      else if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("Unexpected SMS packages response format:", result);
        return [];
      }
    } catch (error) {
      console.error("Error fetching SMS packages:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getMySubscription() {
    try {
      const result = await this.get("/get-my-subscription/");
      return result;
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      throw error;
    }
  }

  static async getSmsCredits() {
    return this.get("/get-my-sms-credits/");
  }

  static async getSmsHistory(page: number = 1) {
    return this.get(`/my-sms-history/?page=${page}`);
  }

  static async purchaseSmsPackage(packageId: number) {
    return this.post("/purchase-sms-package/", { package_id: packageId });
  }

  static async upgradeSubscription(planId: string) {
    try {
      const response = await this.post("/subscription/upgrade/", {
        plan_id: planId,
      });
      return response;
    } catch (error) {
      console.error(`Upgrade subscription error:`, error);
      throw error;
    }
  }

  // Notifications removed

  // Banking employees method (uses the banking transactions endpoint)
  static async getBankingEmployees(params?: string) {
    return this.get(
      `/banking/transactions/employees/${params ? `?${params}` : ""}`
    );
  }

  // Update getDashboardStats to be more specific for transactions
  static async getTransactionDashboardStats(accountId?: string) {
    const queryParams = accountId ? `?account_id=${accountId}` : "";
    return this.get(`/banking/transactions/dashboard_stats/${queryParams}`);
  }

  // Inventory statistics methods
  static async getInventoryStats() {
    return this.get("/products/stats/");
  }

  static async getInventoryStatistics() {
    return this.get("/products/statistics/");
  }

  // Sales methods
  static async getSales(params?: {
    product?: number;
    variant?: number;
    customer_name?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
    date_filter?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let endpoint = "/sales/";

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      endpoint += `?${searchParams.toString()}`;
    }

    return this.get(endpoint);
  }

  static async getSale(id: number) {
    return this.get(`/sales/${id}/`);
  }

  static async getSalesStatistics() {
    return this.get("/sales/statistics/");
  }

  static async getProductSalesSummary(params?: {
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
    date_filter?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let endpoint = "/orders/product_summary/";

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      endpoint += `?${searchParams.toString()}`;
    }

    return this.get(endpoint);
  }

  // Payment gateway methods
  static async makePayment(params: {
    amount: number;
    order_id: string;
    currency: string;
    customer_name: string;
    customer_address: string;
    customer_phone: string;
    customer_city: string;
    customer_post_code: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString());
    });

    const endpoint = `/pay/?${queryParams.toString()}`;

    try {
      const result = await this.get(endpoint);
      return result;
    } catch (error) {
      console.error("Payment API error:", error);
      throw error;
    }
  }

  static async verifyPayment(orderId: string) {
    return this.get(`/verify-payment/?sp_order_id=${orderId}`);
  }

  static async getPaymentHistory(params?: {
    payment_type?: "subscription" | "sms_package" | "unknown";
    is_successful?: boolean;
    is_applied?: boolean;
    ordering?: string;
    page?: number;
    page_size?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.payment_type) queryParams.append("payment_type", params.payment_type);
    if (typeof params?.is_successful === "boolean")
      queryParams.append("is_successful", String(params.is_successful));
    if (typeof params?.is_applied === "boolean")
      queryParams.append("is_applied", String(params.is_applied));
    if (params?.ordering) queryParams.append("ordering", params.ordering);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.page_size) queryParams.append("page_size", String(params.page_size));

    const qs = queryParams.toString();
    return this.get(`/payment-history/${qs ? `?${qs}` : ""}`);
  }

  // API Key management methods
  static async getAPIKeys(): Promise<APIKey[]> {
    const response = await this.get("/public/manage/api-keys/");

    // Handle both paginated and non-paginated responses
    if (response.results) {
      return response.results;
    }
    const result = Array.isArray(response) ? response : [];
    return result;
  }

  static async createAPIKey(data: { name: string }): Promise<APIKey> {
    return this.post("/public/manage/api-keys/", data);
  }

  static async updateAPIKey(
    id: number,
    data: { name?: string; is_active?: boolean }
  ): Promise<APIKey> {
    return this.put(`/public/manage/api-keys/${id}/`, data);
  }

  static async deleteAPIKey(id: number): Promise<void> {
    return this.delete(`/public/manage/api-keys/${id}/`);
  }

  static async regenerateAPIKey(): Promise<APIKey> {
    return this.post("/public/manage/api-keys/regenerate/", {});
  }

  static async getAPIKeyUsageStats(): Promise<APIKeyUsageStats> {
    return this.get("/public/manage/api-keys/usage-stats/");
  }

  static async getAPIKeyUsageLogs(params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    results: APIKeyUsageLog[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    let endpoint = "/public/manage/usage-logs/";

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      endpoint += `?${searchParams.toString()}`;
    }

    return this.get(endpoint);
  }

  // Banking Plan methods
  static async getBankingPlans() {
    try {
      const result = await this.get("/banking/plans/");

      // Handle paginated response - extract results array
      if (result && typeof result === "object" && "results" in result) {
        return result.results;
      }

      // If it's already an array, return as is
      if (Array.isArray(result)) {
        return result;
      }

      return [];
    } catch (error) {
      console.error("getBankingPlans API error:", error);
      throw error;
    }
  }

  static async getUserBankingPlan() {
    return this.get("/banking/user-plan/");
  }

  static async activateBankingPlan(data: {
    account_id: string;
    plan_id: number;
    payment_order_id: string;
    payment_amount: number;
  }) {
    return this.post("/banking/activate-plan/", data);
  }

  // ---------------------------------------------------------------------
  // Vehicles — serial-tracked units (bikes, CNGs, cars). Unlike products,
  // each row is ONE physical unit with its own engine/chassis number.
  // ---------------------------------------------------------------------

  private static buildQuery(params?: Record<string, unknown>) {
    if (!params) return "";
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, String(value));
      }
    });
    const qs = search.toString();
    return qs ? `?${qs}` : "";
  }

  static async getVehicles(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    vehicle_type?: string;
    condition?: string;
    product?: number | string;
    supplier?: number | string;
    customer?: number | string;
    ordering?: string;
  }) {
    return this.get(`/vehicles/${this.buildQuery(params)}`);
  }

  static async getVehicle(id: number | string) {
    return this.get(`/vehicles/${id}/`);
  }

  static async getVehicleStats() {
    return this.get("/vehicles/stats/");
  }

  static async createVehicle(data: Record<string, unknown>) {
    return this.post("/vehicles/", data);
  }

  static async updateVehicle(id: number | string, data: Record<string, unknown>) {
    return this.patch(`/vehicles/${id}/`, data);
  }

  static async deleteVehicle(id: number | string) {
    return this.delete(`/vehicles/${id}/`);
  }

  /** Sells a unit. The backend creates a normal Order, so the sale shows up in
   *  the regular sales list and its payments live on that order. */
  static async sellVehicle(
    id: number | string,
    data: {
      customer: number;
      sell_price: number;
      paid_amount?: number;
      payment_method?: string;
      payment_reference?: string;
      notes?: string;
    }
  ) {
    return this.post(`/vehicles/${id}/sell/`, data);
  }

  /** Undo an installment entered by mistake; the bank transaction goes too. */
  static async removeLoanInstallment(
    loanId: number | string,
    paymentId: number | string
  ) {
    return this.delete(`/banking/loans/${loanId}/payments/${paymentId}/`);
  }

  static async deleteLoanInstallmentReceipt(
    loanId: number | string,
    paymentId: number | string
  ) {
    return this.delete(
      `/banking/loans/${loanId}/payments/${paymentId}/receipt/`
    );
  }

  static async deleteRecurringCostReceipt(
    costId: number | string,
    paymentId: number | string
  ) {
    return this.delete(
      `/banking/recurring-costs/${costId}/payments/${paymentId}/receipt/`
    );
  }

  static async uploadLoanInstallmentReceipt(
    loanId: number | string,
    paymentId: number | string,
    receipt: File
  ) {
    const formData = new FormData();
    formData.append("receipt", receipt);
    return this.postFormData(
      `/banking/loans/${loanId}/payments/${paymentId}/receipt/`,
      formData
    );
  }

  static async cancelVehicleSale(id: number | string) {
    return this.post(`/vehicles/${id}/cancel_sale/`, {});
  }

  static async getVehicleDocuments(id: number | string) {
    return this.get(`/vehicles/${id}/documents/`);
  }

  static async uploadVehicleDocument(
    id: number | string,
    data: { file: File; doc_type: string; title?: string; received_date?: string; notes?: string }
  ) {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("doc_type", data.doc_type);
    if (data.title) formData.append("title", data.title);
    if (data.received_date) formData.append("received_date", data.received_date);
    if (data.notes) formData.append("notes", data.notes);
    return this.postFormData(`/vehicles/${id}/documents/`, formData);
  }

  static async deleteVehicleDocument(
    vehicleId: number | string,
    documentId: number | string
  ) {
    return this.delete(`/vehicles/${vehicleId}/documents/${documentId}/`);
  }

  /** Units bought by one customer — powers the vehicle tab on their profile. */
  static async getCustomerVehicles(customerId: number | string) {
    return this.get(`/vehicles/by-customer/${customerId}/`);
  }

  // ---------------------------------------------------------------------
  // Analytics — one request returns the whole report so every figure on the
  // screen is computed against the same period.
  // ---------------------------------------------------------------------

  static async getAnalyticsOverview(params?: {
    period?: string;
    start?: string;
    end?: string;
  }) {
    return this.get(`/analytics/overview/${this.buildQuery(params)}`);
  }

  // ── Payroll: advances, balances and bulk payment ──────────────────
  static async getPayroll() {
    return this.get("/payroll/");
  }

  static async getEmployeePayroll(employeeId: number) {
    return this.get(`/payroll/${employeeId}/`);
  }

  static async paySalaries(data: {
    account?: number | null;
    method?: string;
    note?: string | null;
    payments: { employee: number; amount: number; kind: string }[];
  }) {
    return this.post("/payroll/pay/", data);
  }

  static async removeSalaryPayment(paymentId: number) {
    return this.delete(`/payroll/payments/${paymentId}/`);
  }

  // ── Role settings: staff logins and what they may do ──────────────
  static async getPermissionCatalogue() {
    return this.get("/roles/permissions/");
  }

  static async getEmployeeAccess() {
    return this.get("/roles/access/");
  }

  static async createEmployeeAccess(
    employeeId: number,
    data: { password: string; permissions: string[] }
  ) {
    return this.post(`/roles/access/${employeeId}/`, data);
  }

  static async updateEmployeeAccess(
    employeeId: number,
    data: { permissions?: string[]; is_enabled?: boolean; password?: string }
  ) {
    return this.patch(`/roles/access/${employeeId}/`, data);
  }

  static async deleteEmployeeAccess(employeeId: number) {
    return this.delete(`/roles/access/${employeeId}/`);
  }

  /** Recent activity across every module — the dashboard's short reports. */
  static async getDashboardFeed() {
    return this.get("/analytics/feed/");
  }

  /** Rows behind one analytics signal — idle products, overdue customers, … */
  static async getAnalyticsDetail(params: {
    topic: string;
    period?: string;
    start?: string;
    end?: string;
  }) {
    return this.get(`/analytics/detail/${this.buildQuery(params)}`);
  }

  // ---------------------------------------------------------------------
  // Loans — money the shop is repaying. Installments are a fixed monthly
  // cost, so analytics reads them when working out the daily target.
  // ---------------------------------------------------------------------

  static async getLoans(params?: {
    status?: string;
    account?: number | string;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    return this.get(`/banking/loans/${this.buildQuery(params)}`);
  }

  /** Preset expense buckets plus the ones this shop has typed before. */
  /** Uploads an employee's profile photo (multipart — a File cannot ride in JSON). */
  static async uploadEmployeePhoto(id: number | string, photo: File) {
    const formData = new FormData();
    formData.append("photo", photo);
    return this.request(`/employees/${id}/`, {
      method: "PATCH",
      body: formData,
    });
  }

  /** Recent money movement across every account — used by the dashboard. */
  static async getTransactions(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    type?: string;
    nature?: string;
  }) {
    return this.get(`/banking/transactions/${this.buildQuery(params)}`);
  }

  // ── Forgotten password: request a code, verify it, set the password ──

  static async requestPasswordReset(data: {
    identifier: string;
    channel: "email" | "sms";
  }) {
    return this.post("/auth/password-reset/request/", data);
  }

  static async verifyPasswordResetCode(data: {
    identifier: string;
    code: string;
  }) {
    return this.post("/auth/password-reset/verify/", data);
  }

  static async confirmPasswordReset(data: {
    identifier: string;
    code: string;
    password: string;
  }) {
    return this.post("/auth/password-reset/confirm/", data);
  }

  /** Orders honouring the list filters — used by the sales report. */
  static async getOrdersList(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    customer?: string;
    ordering?: string;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get(`/orders/${this.buildQuery(params)}`);
  }

  static async getExpenseCategories() {
    return this.get("/banking/expense-categories/");
  }

  // ── Recurring fixed costs (office rent and the like) ─────────────────

  static async getRecurringCosts(params?: { is_active?: boolean; search?: string }) {
    return this.get(`/banking/recurring-costs/${this.buildQuery(params)}`);
  }

  static async getRecurringCostSummary() {
    return this.get("/banking/recurring-costs/summary/");
  }

  static async createRecurringCost(data: Record<string, unknown>) {
    return this.post("/banking/recurring-costs/", data);
  }

  static async updateRecurringCost(id: number | string, data: Record<string, unknown>) {
    return this.patch(`/banking/recurring-costs/${id}/`, data);
  }

  static async deleteRecurringCost(id: number | string) {
    return this.delete(`/banking/recurring-costs/${id}/`);
  }

  /** Settles one month; writes the matching bank expense too. */
  static async payRecurringCost(
    id: number | string,
    data?: { period?: string; amount?: number }
  ) {
    return this.post(`/banking/recurring-costs/${id}/pay/`, data ?? {});
  }

  /** Attaches the money receipt to a month already settled. */
  static async uploadRecurringCostReceipt(
    costId: number | string,
    paymentId: number | string,
    receipt: File
  ) {
    const formData = new FormData();
    formData.append("receipt", receipt);
    return this.postFormData(
      `/banking/recurring-costs/${costId}/payments/${paymentId}/receipt/`,
      formData
    );
  }

  static async removeRecurringCostPayment(
    costId: number | string,
    paymentId: number | string
  ) {
    return this.delete(`/banking/recurring-costs/${costId}/payments/${paymentId}/`);
  }

  static async getLoanSummary() {
    return this.get("/banking/loans/summary/");
  }

  static async createLoan(data: Record<string, unknown>) {
    return this.post("/banking/loans/", data);
  }

  static async updateLoan(id: number | string, data: Record<string, unknown>) {
    return this.patch(`/banking/loans/${id}/`, data);
  }

  static async deleteLoan(id: number | string) {
    return this.delete(`/banking/loans/${id}/`);
  }

  /** Records an installment and writes the matching bank transaction. */
  static async payLoanInstallment(
    id: number | string,
    data?: { amount?: number; paid_on?: string; reference?: string }
  ) {
    return this.post(`/banking/loans/${id}/pay/`, data ?? {});
  }
}
