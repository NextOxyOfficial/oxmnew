const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
    const url = `${API_BASE_URL}${endpoint}`;
    const token = AuthToken.get();

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

  static async get(endpoint: string) {
    return this.request(endpoint, { method: "GET" });
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
  }) {
    return this.put("/auth/profile/", profileData);
  }

  static async uploadStoreLogo(file: File) {
    const formData = new FormData();
    formData.append("store_logo", file);

    return this.request("/auth/profile/upload-logo/", {
      method: "POST",
      body: formData,
    });
  }

  static async uploadBannerImage(file: File) {
    const formData = new FormData();
    formData.append("banner_image", file);

    return this.request("/auth/profile/upload-banner/", {
      method: "POST",
      body: formData,
    });
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
    balance?: number;
  }) {
    return this.post("/banking/accounts/", {
      ...accountData,
      balance: accountData.balance || 0,
    });
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
  ) {
    let endpoint = `/banking/accounts/${accountId}/transactions/`;

    if (filters && Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      endpoint = `${endpoint}${queryString ? `?${queryString}` : ""}`;
    }

    return this.get(endpoint);
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
    return this.get("/levels/");
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
    return this.get("/brands/");
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
    return this.get("/payment-methods/");
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
    category?: string;
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

    return this.get(endpoint);
  }

  static async searchProducts(query: string) {
    if (!query || query.trim().length < 1) {
      return [];
    }
    return this.get(`/products/?search=${encodeURIComponent(query.trim())}`);
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
    }
  ) {
    return this.post(`/products/${productId}/adjust_stock/`, stockData);
  }

  static async getProductStockMovements(productId?: number) {
    const url = productId
      ? `/stock-movements/?product=${productId}`
      : "/stock-movements/";
    return this.get(url);
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
  }) {
    return this.post("/customers/", customerData);
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
    customer: number;
    status?: string;
    total_amount: number;
    paid_amount?: number;
    discount_amount?: number;
    tax_amount?: number;
    notes?: string;
    delivery_address?: string;
    expected_delivery_date?: string;
  }) {
    return this.post("/orders/", orderData);
  }

  static async updateOrder(id: number, orderData: Partial<Order>) {
    return this.put(`/orders/${id}/`, orderData);
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

  static async getProductSale(id: number) {
    return this.get(`/sales/${id}/`);
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
    proof_document?: string;
    items?: Array<{
      product: number;
      quantity: number;
      price: number;
    }>;
  }) {
    return this.post("/purchases/", purchaseData);
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
    return this.put(`/purchases/${id}/`, purchaseData);
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
    proof_document?: string;
  }) {
    return this.post("/payments/", paymentData);
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
    return this.put(`/payments/${id}/`, paymentData);
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

    const fullUrl = `${BACKEND_BASE_URL}${cleanPath}`;

    // Debug logging for development
    if (process.env.NODE_ENV === "development") {
      console.log("Image URL constructed:", {
        relativePath,
        cleanPath,
        BACKEND_BASE_URL,
        fullUrl,
      });
    }

    return fullUrl;
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
    return this.get("/my-sms-credits/");
  }

  static async getSmsHistory() {
    return this.get("/my-sms-history/");
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
}
