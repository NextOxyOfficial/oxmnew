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
        } catch (parseError) {
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
      } catch (parseError) {
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
  static async getEmployees() {
    return this.get("/employees/");
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
      const { photo, ...dataWithoutPhoto } = employeeData;
      return this.patch(`/employees/${id}/`, dataWithoutPhoto);
    }
  }

  static async deleteEmployee(id: number) {
    return this.delete(`/employees/${id}/`);
  }

  // Banking methods
  static async getBankAccounts() {
    return this.get("/banking/accounts/");
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
    return this.get("/categories/");
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
    return this.get("/gifts/");
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
    return this.get("/achievements/");
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
  static async getSuppliers() {
    return this.get("/suppliers/");
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

  // Purchase methods
  static async getPurchases() {
    return this.get("/purchases/");
  }

  static async createPurchase(purchaseData: {
    supplier: number;
    date: string;
    amount: number;
    status: string;
    products?: string;
    notes?: string;
    proof_document?: File | string;
  }) {
    return this.post("/purchases/", purchaseData);
  }

  static async updatePurchase(id: number, purchaseData: any) {
    return this.put(`/purchases/${id}/`, purchaseData);
  }

  static async deletePurchase(id: number) {
    return this.delete(`/purchases/${id}/`);
  }

  // Payment methods
  static async getPayments() {
    return this.get("/payments/");
  }

  static async createPayment(paymentData: {
    supplier: number;
    date: string;
    amount: number;
    method: string;
    status: string;
    reference?: string;
    notes?: string;
    proof_document?: File | string;
  }) {
    return this.post("/payments/", paymentData);
  }

  static async updatePayment(id: number, paymentData: any) {
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
    return `${BACKEND_BASE_URL}${relativePath}`;
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
      return result;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      throw error;
    }
  }

  static async getSmsPackages() {
    try {
      console.log("Fetching SMS packages...");
      const result = await this.get("/sms-packages/");
      console.log("SMS packages result:", result);
      return result;
    } catch (error) {
      console.error("Error fetching SMS packages:", error);
      throw error;
    }
  }

  static async getMySubscription() {
    try {
      console.log("Fetching user subscription...");
      const result = await this.get("/my-subscription/");
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
    return this.post("/add-sms-credits/", { package_id: packageId });
  }

  static async upgradeSubscription(planId: string) {
    return this.post("/subscription/upgrade/", { plan_id: planId });
  }

  // Notifications
  static async getNotifications() {
    return this.get("/notifications/");
  }

  // Banking employees method (separate from regular employees)
  static async getBankingEmployees() {
    return this.get("/banking/transactions/employees/");
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
}
