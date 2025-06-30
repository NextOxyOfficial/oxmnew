import { API_BASE_URL } from "./config";
import { AuthToken } from "../api";

// Types
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  status: "active" | "inactive" | "blocked";
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  active_gifts_count: number;
  total_points: number;
  current_level?: {
    id: number;
    level: {
      id: number;
      name: string;
      is_active: boolean;
      created_at: string;
    };
    assigned_date: string;
    notes?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer: number;
  customer_name: string;
  order_number: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  discount_amount: number;
  tax_amount: number;
  notes?: string;
  delivery_address?: string;
  expected_delivery_date?: string;
  items_count: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  variant?: number;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CustomerGift {
  id: number;
  customer: number;
  customer_name: string;
  gift: number;
  gift_name: string;
  value: number;
  status: "active" | "used" | "expired";
  description?: string;
  expiry_date?: string;
  used_date?: string;
  used_in_order?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerAchievement {
  id: number;
  customer: number;
  customer_name: string;
  achievement: number;
  achievement_name: string;
  achievement_type: string;
  achievement_points: number;
  earned_date: string;
  notes?: string;
}

export interface CustomerLevel {
  id: number;
  customer: number;
  customer_name: string;
  level: number;
  level_name: string;
  assigned_date: string;
  is_current: boolean;
  notes?: string;
  assigned_by: number;
  assigned_by_name: string;
}

export interface DuePayment {
  id: number;
  customer: number;
  customer_name: string;
  order?: number;
  order_number?: string;
  amount: number;
  payment_type: "due" | "advance";
  due_date: string;
  status: "pending" | "paid" | "partially_paid" | "overdue";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  customer: number;
  customer_name: string;
  order?: number;
  order_number?: string;
  due_payment?: number;
  transaction_type: "payment" | "refund" | "adjustment";
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  notify_customer: boolean;
  sms_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableGift {
  id: number;
  name: string;
  is_active: boolean;
}

export interface AvailableAchievement {
  id: number;
  name: string;
  type: string;
  value: number;
  points: number;
  is_active: boolean;
}

export interface AvailableLevel {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  top_customers: Customer[];
}

// API functions
export const customersAPI = {
  // Helper function to get headers with auth
  getHeaders: () => {
    const token = AuthToken.get();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Token ${token}` }),
    };
  },

  // Customers
  getCustomers: async (params?: {
    search?: string;
    status?: string;
    ordering?: string;
  }): Promise<Customer[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status && params.status !== "all")
      queryParams.append("status", params.status);
    if (params?.ordering) queryParams.append("ordering", params.ordering);

    const response = await fetch(
      `${API_BASE_URL}/api/customers/?${queryParams}`,
      {
        headers: customersAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch customers");
    }

    return response.json();
  },

  getCustomer: async (id: number): Promise<Customer> => {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}/`, {
      headers: customersAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch customer");
    }

    return response.json();
  },

  createCustomer: async (
    customer: Omit<
      Customer,
      | "id"
      | "total_orders"
      | "total_spent"
      | "last_order_date"
      | "active_gifts_count"
      | "total_points"
      | "current_level"
      | "created_at"
      | "updated_at"
    >
  ): Promise<Customer> => {
    const response = await fetch(`${API_BASE_URL}/api/customers/`, {
      method: "POST",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(customer),
    });

    if (!response.ok) {
      throw new Error("Failed to create customer");
    }

    return response.json();
  },

  updateCustomer: async (
    id: number,
    customer: Partial<Customer>
  ): Promise<Customer> => {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}/`, {
      method: "PATCH",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(customer),
    });

    if (!response.ok) {
      throw new Error("Failed to update customer");
    }

    return response.json();
  },

  deleteCustomer: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}/`, {
      method: "DELETE",
      headers: customersAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete customer");
    }
  },

  getCustomerSummary: async (id: number) => {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/${id}/summary/`,
      {
        headers: customersAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch customer summary");
    }

    return response.json();
  },

  // Orders
  getOrders: async (params?: {
    customer?: number;
    status?: string;
    ordering?: string;
  }): Promise<Order[]> => {
    const queryParams = new URLSearchParams();
    if (params?.customer)
      queryParams.append("customer", params.customer.toString());
    if (params?.status && params.status !== "all")
      queryParams.append("status", params.status);
    if (params?.ordering) queryParams.append("ordering", params.ordering);

    const response = await fetch(`${API_BASE_URL}/api/orders/?${queryParams}`, {
      headers: customersAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    return response.json();
  },

  createOrder: async (order: Partial<Order>): Promise<Order> => {
    const response = await fetch(`${API_BASE_URL}/api/orders/`, {
      method: "POST",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error("Failed to create order");
    }

    return response.json();
  },

  // Customer Gifts
  getCustomerGifts: async (customerId?: number): Promise<CustomerGift[]> => {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append("customer", customerId.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/customer-gifts/?${queryParams}`,
      {
        headers: customersAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch customer gifts");
    }

    return response.json();
  },

  addCustomerGift: async (gift: {
    customer: number;
    gift: number;
    value: number;
    description?: string;
  }): Promise<CustomerGift> => {
    const response = await fetch(`${API_BASE_URL}/api/customer-gifts/`, {
      method: "POST",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(gift),
    });

    if (!response.ok) {
      throw new Error("Failed to add customer gift");
    }

    return response.json();
  },

  redeemGift: async (giftId: number) => {
    const response = await fetch(
      `${API_BASE_URL}/api/customer-gifts/${giftId}/redeem/`,
      {
        method: "POST",
        headers: customersAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to redeem gift");
    }

    return response.json();
  },

  // Due Payments
  getDuePayments: async (customerId?: number): Promise<DuePayment[]> => {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append("customer", customerId.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/due-payments/?${queryParams}`,
      {
        headers: customersAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch due payments");
    }

    return response.json();
  },

  createDuePayment: async (payment: {
    customer: number;
    order?: number;
    amount: number;
    payment_type: "due" | "advance";
    due_date: string;
    notes?: string;
  }): Promise<DuePayment> => {
    const response = await fetch(`${API_BASE_URL}/api/due-payments/`, {
      method: "POST",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error("Failed to create due payment");
    }

    return response.json();
  },

  // Transactions
  createTransaction: async (transaction: {
    customer: number;
    order?: number;
    due_payment?: number;
    transaction_type: "payment" | "refund" | "adjustment";
    amount: number;
    payment_method?: string;
    notes?: string;
    notify_customer?: boolean;
  }): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
      method: "POST",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error("Failed to create transaction");
    }

    return response.json();
  },

  // Customer Actions
  sendSMS: async (customerId: number, message: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/${customerId}/send-sms/`,
      {
        method: "POST",
        headers: customersAPI.getHeaders(),
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }

    return response.json();
  },

  redeemPoints: async (customerId: number, amount: number) => {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/${customerId}/redeem-points/`,
      {
        method: "POST",
        headers: customersAPI.getHeaders(),
        body: JSON.stringify({ amount }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to redeem points");
    }

    return response.json();
  },

  // Available data
  getAvailableGifts: async (): Promise<AvailableGift[]> => {
    const response = await fetch(`${API_BASE_URL}/api/available-gifts/`, {
      headers: customersAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available gifts");
    }

    return response.json();
  },

  getAvailableLevels: async (): Promise<AvailableLevel[]> => {
    const response = await fetch(`${API_BASE_URL}/api/available-levels/`, {
      headers: customersAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available levels");
    }

    return response.json();
  },

  getAvailableAchievements: async (): Promise<AvailableAchievement[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/available-achievements/`,
      {
        headers: customersAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch available achievements");
    }

    return response.json();
  },

  // Customer Levels
  assignLevel: async (level: {
    customer: number;
    level: number;
    notes?: string;
  }): Promise<CustomerLevel> => {
    const response = await fetch(`${API_BASE_URL}/api/customer-levels/`, {
      method: "POST",
      headers: customersAPI.getHeaders(),
      body: JSON.stringify(level),
    });

    if (!response.ok) {
      throw new Error("Failed to assign level");
    }

    return response.json();
  },

  // Statistics
  getCustomerStats: async (): Promise<CustomerStats> => {
    const response = await fetch(`${API_BASE_URL}/api/customers/statistics/`, {
      headers: customersAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch customer statistics");
    }

    return response.json();
  },
};
