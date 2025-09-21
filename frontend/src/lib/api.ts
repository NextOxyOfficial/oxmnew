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
  
  // Always log production detection for debugging
  if (typeof window !== 'undefined') {
    console.log('🔍 Production detection:', {
      nodeEnvProduction,
      notLocalhost,
      hostname: window.location.hostname,
      href: window.location.href,
      env: process.env.NODE_ENV,
      result,
      envApiUrl: process.env.NEXT_PUBLIC_API_URL,
      envBackendUrl: process.env.NEXT_PUBLIC_BACKEND_URL
    });
  }
  
  return result;
};

// Get the production backend URL based on current domain
const getProductionBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // If we have environment variable, use it in production
    if (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL !== "http://localhost:8000") {
      console.log('🌐 Using environment backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    
    // Fallback to current domain
    const url = `${window.location.protocol}//${window.location.hostname}${window.location.port && window.location.port !== '80' && window.location.port !== '443' ? ':' + window.location.port : ''}`;
    
    console.log('🌐 Using dynamic backend URL:', url);
    return url;
  }
  return BACKEND_BASE_URL;
};

// Get the API URL for requests
const getApiUrl = () => {
  if (isProduction()) {
    // In production, prefer environment variable, fallback to dynamic
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== "http://localhost:8000/api") {
      console.log('🚀 Using environment API URL:', process.env.NEXT_PUBLIC_API_URL);
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    const backendUrl = getProductionBackendUrl();
    const apiUrl = `${backendUrl}/api`;
    console.log('🚀 Using dynamic API URL:', apiUrl);
    return apiUrl;
  }
  
  console.log('💻 Using development API URL:', API_BASE_URL);
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
    | "pending"
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
    console.log('📡 API Request:', {
      endpoint,
      apiUrl,
      url,
      isProduction: isProduction(),
      method: options.method || 'GET',
      hasToken: !!token,
      isFormData: options.body instanceof FormData
    });

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
        console.error(`API Error Response (${response.status}):`, responseText);

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
    console.log('🖼️ Starting store logo upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      apiUrl: getApiUrl(),
      isProduction: isProduction()
    });
    
    const formData = new FormData();
    formData.append("store_logo", file);

    try {
      const response = await this.request("/auth/profile/upload-logo/", {
        method: "POST",
        body: formData,
      });
      
      console.log('✅ Store logo upload successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Store logo upload failed:', error);
      throw error;
    }
  }

  static async uploadBannerImage(file: File) {
    console.log('🖼️ Starting banner image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      apiUrl: getApiUrl(),
      isProduction: isProduction()
    });
    
    const formData = new FormData();
    formData.append("banner_image", file);

    try {
      const response = await this.request("/auth/profile/upload-banner/", {
        method: "POST",
        body: formData,
      });
      
      console.log('✅ Banner image upload successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Banner image upload failed:', error);
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

  // Banking methods
  static async getBankAccounts() {
    // Try the my_accounts endpoint first, fallback to regular accounts
    try {
      return this.get("/banking/accounts/my_accounts/");
    } catch (error) {
      console.log(
        "my_accounts endpoint failed, trying regular accounts endpoint"
      );
      return this.get("/banking/accounts/");
    }
  }

  static async createBankAccount(accountData: {
    name: string;
    account_number?: string;
    balance?: number;
    is_active?: boolean;
  }) {
    console.log("🏦 Creating bank account with data:", accountData);
    try {
      const response = await this.post("/banking/accounts/", {
        ...accountData,
        balance: accountData.balance || 0,
        is_active: accountData.is_active !== undefined ? accountData.is_active : true,
      });
      console.log("🏦 Bank account created successfully:", response);
      return response;
    } catch (error: any) {
      console.error("🏦 Failed to create bank account:", error);
      console.error("🏦 Error response:", error?.response?.data);
      console.error("🏦 Error status:", error?.response?.status);
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
    let endpoint = `/banking/accounts/${accountId}/transactions/`;

    if (filters && Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      endpoint = `${endpoint}${queryString ? `?${queryString}` : ""}`;
    }

    const response = await this.get(endpoint);
    
    // Handle both paginated and non-paginated responses
    // If response has 'results' property, it's paginated
    if (response && typeof response === 'object' && 'results' in response) {
      return response as PaginatedTransactions;
    }
    
    // Otherwise, it's a regular array (backward compatibility)
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

  // Categories methods
  static async getCategories() {
    try {
      const result = await this.get("/categories/");
      console.log("Categories result:", result);

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
  static async getSuppliers(page?: number) {
    try {
      const url = page ? `/suppliers/?page=${page}` : "/suppliers/";
      console.log('API: Making suppliers request to:', url);
      console.log('API: Auth token:', AuthToken.get() ? 'Present' : 'Missing');
      
      const result = await this.get(url);
      
      console.log('API: Suppliers response received:', result);

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
    category?: string;
    supplier?: string;
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

    console.log('API: Making products request to:', endpoint);
    const result = await this.get(endpoint);
    console.log('API: Products response received:', result);
    
    return result;
  }

  static async searchProducts(query: string, signal?: AbortSignal) {
    if (!query || query.trim().length < 1) {
      return [];
    }
    
    try {
      // For search, we want to get all matching results in one request
      // Use a very large page_size to avoid pagination issues
      const response = await this.get(`/products/?search=${encodeURIComponent(query.trim())}&page_size=50000`, signal);
      
      // Check if request was aborted
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      
      // Handle paginated response
      if (response && response.results && Array.isArray(response.results)) {
        console.log(`API: Search returned ${response.results.length} products out of ${response.count} total`);
        console.log(`API: Response pagination info:`, { 
          count: response.count, 
          next: response.next, 
          previous: response.previous 
        });
        
        // With page_size=50000, we should get all results in one page for most searches
        // Only paginate if absolutely necessary (more than 50000 matching results)
        if (!response.next || response.results.length >= (response.count || 0)) {
          console.log(`API: All search results fetched in single request: ${response.results.length}`);
          return response.results;
        }
        
        // If there are still more pages (very rare case), fetch them
        console.log(`API: Warning - Search has more than 50000 results, using pagination`);
        const allResults = [...response.results];
        let nextPage = 2;
        
        while (allResults.length < (response.count || 0) && nextPage <= 10) { // Limit to 10 pages max for safety
          // Check if request was aborted before each pagination request
          if (signal?.aborted) {
            throw new Error('Request aborted');
          }
          
          try {
            const nextResponse = await this.get(`/products/?search=${encodeURIComponent(query.trim())}&page_size=50000&page=${nextPage}`, signal);
            console.log(`API: Page ${nextPage} response:`, { 
              resultsLength: nextResponse?.results?.length, 
              hasNext: !!nextResponse?.next 
            });
            
            if (nextResponse && nextResponse.results && Array.isArray(nextResponse.results) && nextResponse.results.length > 0) {
              allResults.push(...nextResponse.results);
              nextPage++;
              
              // Stop if no more pages
              if (!nextResponse.next) break;
            } else {
              console.log(`API: No more results on page ${nextPage}, stopping`);
              break;
            }
          } catch (error) {
            if (error instanceof Error && error.message === 'Request aborted') {
              throw error; // Re-throw abort errors
            }
            console.warn(`Failed to fetch page ${nextPage}:`, error);
            break;
          }
        }
        
        console.log(`API: Total search results fetched: ${allResults.length}`);
        return allResults;
      } else if (Array.isArray(response)) {
        console.log(`API: Search returned ${response.length} products (direct array)`);
        return response;
      } else {
        console.log('API: Unexpected search response format:', response);
        return [];
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Request aborted') {
        console.log('🚫 Search request was aborted');
        throw new Error('AbortError'); // Standardize abort error name
      }
      console.error('API: Error in searchProducts:', error);
      return [];
    }
  }

  static async getProduct(id: number) {
    return this.get(`/products/${id}/`);
  }

  static async createProduct(productData: {
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
    is_active?: boolean;
  }) {
    return this.post("/products/", productData);
  }

  static async updateProduct(id: number, productData: Partial<Product>) {
    return this.put(`/products/${id}/`, productData);
  }

  static async deleteProduct(id: number) {
    return this.delete(`/products/${id}/`);
  }

  static async toggleProduct(id: number) {
    return this.put(`/products/${id}/toggle/`, {});
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
  static async getCustomers() {
    try {
      const result = await this.get("/customers/");

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

  static async getProductSalesSummary(params?: {
    page?: number;
    page_size?: number;
    search?: string;
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
    console.log('createPurchase called with:', purchaseData);
    console.log('proof_document type:', typeof purchaseData.proof_document);
    console.log('proof_document instanceof File:', purchaseData.proof_document instanceof File);
    
    // If we have a file, use FormData for file upload
    if (purchaseData.proof_document instanceof File) {
      console.log('Using FormData for file upload');
      const formData = new FormData();
      formData.append('supplier', purchaseData.supplier.toString());
      if (purchaseData.date) formData.append('date', purchaseData.date);
      if (purchaseData.amount) formData.append('amount', purchaseData.amount.toString());
      if (purchaseData.status) formData.append('status', purchaseData.status);
      if (purchaseData.products) formData.append('products', purchaseData.products);
      if (purchaseData.notes) formData.append('notes', purchaseData.notes);
      formData.append('proof_document', purchaseData.proof_document);
      if (purchaseData.items) formData.append('items', JSON.stringify(purchaseData.items));

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      return this.postFormData("/purchases/", formData);
    } else {
      console.log('Using regular JSON request');
      // Regular JSON request without file
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
    console.log("API updatePurchase called with:", { id, purchaseData });
    console.log("Making PATCH request to:", `/purchases/${id}/`);
    
    try {
      // Use PATCH instead of PUT for partial updates
      const result = await this.patch(`/purchases/${id}/`, purchaseData);
      console.log("API updatePurchase response:", result);
      return result;
    } catch (error) {
      console.error("API updatePurchase error:", error);
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
    console.log('createPayment called with:', paymentData);
    console.log('proof_document type:', typeof paymentData.proof_document);
    console.log('proof_document instanceof File:', paymentData.proof_document instanceof File);
    
    // If we have a file, use FormData for file upload
    if (paymentData.proof_document instanceof File) {
      console.log('Using FormData for file upload');
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

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      return this.postFormData("/payments/", formData);
    } else {
      console.log('Using regular JSON request');
      // Regular JSON request without file
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
    console.log("API updatePayment called with:", { id, paymentData });
    console.log("Making PATCH request to:", `/payments/${id}/`);
    
    try {
      // Use PATCH instead of PUT for partial updates
      const result = await this.patch(`/payments/${id}/`, paymentData);
      console.log("API updatePayment response:", result);
      return result;
    } catch (error) {
      console.error("API updatePayment error:", error);
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

    // Debug logging for development
    if (process.env.NODE_ENV === "development") {
      console.log("Image URL constructed:", {
        relativePath,
        cleanPath,
        BACKEND_BASE_URL,
        backendUrl,
        fullUrl,
        urlWithCacheBust,
        isProduction: isProduction(),
      });
    }

    return urlWithCacheBust;
  }

  static async sendSmsNotification(phone: string, message: string) {
    const data = { phone, message };
    return this.post("/send-sms/", data);
  }

  // Subscription API methods
  static async getSubscriptionPlans() {
    try {
      console.log("Fetching subscription plans...");
      const result = await this.get("/plans/");
      console.log("Subscription plans result:", result);

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
      console.log("Fetching SMS packages...");
      const result = await this.get("/sms-packages/");
      console.log("SMS packages result:", result);

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
      console.log("Fetching user subscription...");
      const result = await this.get("/get-my-subscription/");
      console.log("User subscription result:", result);
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
    console.log(`=== UPGRADING SUBSCRIPTION ===`);
    console.log(`Plan ID: ${planId}`);
    console.log(`API endpoint: /subscription/upgrade/`);
    console.log(`Request data:`, { plan_id: planId });

    try {
      const response = await this.post("/subscription/upgrade/", {
        plan_id: planId,
      });
      console.log(`Upgrade response:`, response);
      return response;
    } catch (error) {
      console.error(`Upgrade subscription error:`, error);
      throw error;
    }
  }

  // Notifications
  static async getNotifications() {
    return this.get("/notifications/");
  }

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

  // Debug and testing methods
  static async testEndpoint(endpoint: string) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Testing endpoint: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Token ${AuthToken.get()}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`Endpoint ${endpoint} response status:`, response.status);
      console.log(
        `Endpoint ${endpoint} response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      const responseText = await response.text();
      console.log(`Endpoint ${endpoint} response body:`, responseText);

      return {
        status: response.status,
        ok: response.ok,
        body: responseText,
      };
    } catch (error) {
      console.error(`Error testing endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  // Test customers endpoint specifically
  static async testCustomersEndpoint() {
    console.log("=== DEBUG: Testing Customers Endpoint ===");
    console.log("API Base URL:", API_BASE_URL);
    console.log("Backend Base URL:", BACKEND_BASE_URL);
    const token = AuthToken.get();
    console.log(
      "Auth Token:",
      token ? `Present (${token.substring(0, 10)}...)` : "Missing"
    );

    try {
      console.log("\n--- Testing /customers/ endpoint ---");
      const result = await this.testEndpoint("/customers/");
      console.log("Customers endpoint test result:", result);
      return result;
    } catch (error) {
      console.error("Failed to test customers endpoint:", error);
      throw error;
    }
  }

  static async debugSubscriptionEndpoints() {
    console.log("=== DEBUG: Testing Subscription Endpoints ===");
    console.log("API Base URL:", API_BASE_URL);
    console.log("Backend Base URL:", BACKEND_BASE_URL);
    const token = AuthToken.get();
    console.log(
      "Auth Token:",
      token ? `Present (${token.substring(0, 10)}...)` : "Missing"
    );

    const endpoints = [
      { path: "/plans/", requiresAuth: false },
      { path: "/sms-packages/", requiresAuth: false },
      { path: "/my-subscription/", requiresAuth: true },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(
          `\n--- Testing ${endpoint.path} (Auth required: ${endpoint.requiresAuth}) ---`
        );
        await this.testEndpoint(endpoint.path);
      } catch (error) {
        console.error(`Failed to test ${endpoint.path}:`, error);
      }
    }

    // Also test if the base API is working
    try {
      console.log("\n--- Testing base API health ---");
      await this.testEndpoint("/health/");
    } catch (error) {
      console.error("Failed to test health endpoint:", error);
    }
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
    console.log("=== MAKE PAYMENT API CALL ===");
    console.log("Params:", params);

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString());
    });

    const endpoint = `/pay/?${queryParams.toString()}`;
    console.log("Payment endpoint:", endpoint);

    try {
      const result = await this.get(endpoint);
      console.log("Payment API result:", result);
      return result;
    } catch (error) {
      console.error("Payment API error:", error);
      throw error;
    }
  }

  static async verifyPayment(orderId: string) {
    return this.get(`/verify-payment/?sp_order_id=${orderId}`);
  }

  // API Key management methods
  static async getAPIKeys(): Promise<APIKey[]> {
    const response = await this.get("/public/manage/api-keys/");
    console.log("Raw API Keys response:", response);

    // Handle both paginated and non-paginated responses
    if (response.results) {
      console.log("Found paginated results:", response.results);
      return response.results;
    }
    // If it's not paginated, it should be an array
    const result = Array.isArray(response) ? response : [];
    console.log("Processed API Keys result:", result);
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
    console.log("🚀 ApiService.getBankingPlans called");
    console.log("🌐 Making request to:", "/banking/plans/");
    try {
      const result = await this.get("/banking/plans/");
      console.log("📦 Raw API response:", result);

      // Handle paginated response - extract results array
      if (result && typeof result === "object" && "results" in result) {
        console.log("📋 Extracted plans from results:", result.results);
        return result.results;
      }

      // If it's already an array, return as is
      if (Array.isArray(result)) {
        console.log("📋 Plans already in array format:", result);
        return result;
      }

      console.warn("⚠️ Unexpected response format, returning empty array");
      return [];
    } catch (error) {
      console.error("💥 getBankingPlans API error:", error);
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
}
