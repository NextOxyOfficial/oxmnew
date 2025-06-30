// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login/",
  LOGOUT: "/api/auth/logout/",
  REGISTER: "/api/auth/register/",

  // Customers
  CUSTOMERS: "/api/customers/",
  CUSTOMER_DETAIL: (id: number) => `/api/customers/${id}/`,
  CUSTOMER_SUMMARY: (id: number) => `/api/customers/${id}/summary/`,
  CUSTOMER_STATS: "/api/customers/statistics/",

  // Orders
  ORDERS: "/api/orders/",
  ORDER_DETAIL: (id: number) => `/api/orders/${id}/`,

  // Gifts
  CUSTOMER_GIFTS: "/api/customer-gifts/",
  AVAILABLE_GIFTS: "/api/available-gifts/",
  REDEEM_GIFT: (id: number) => `/api/customer-gifts/${id}/redeem/`,

  // Achievements
  CUSTOMER_ACHIEVEMENTS: "/api/customer-achievements/",
  AVAILABLE_ACHIEVEMENTS: "/api/available-achievements/",

  // Levels
  CUSTOMER_LEVELS: "/api/customer-levels/",
  AVAILABLE_LEVELS: "/api/available-levels/",

  // Payments
  DUE_PAYMENTS: "/api/due-payments/",
  TRANSACTIONS: "/api/transactions/",

  // Actions
  SEND_SMS: (customerId: number) => `/api/customers/${customerId}/send-sms/`,
  REDEEM_POINTS: (customerId: number) =>
    `/api/customers/${customerId}/redeem-points/`,

  // Core data
  CATEGORIES: "/api/categories/",
  SUPPLIERS: "/api/suppliers/",
  PRODUCTS: "/api/products/",
};

// Default headers
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Error handling
export class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to handle API responses
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || "An error occurred",
      response.status,
      errorData
    );
  }

  return response.json();
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.Authorization = `Token ${token}`;
    }
  }

  return headers;
};
