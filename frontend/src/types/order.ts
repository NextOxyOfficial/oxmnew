// Order/Sale types for the application

// Customer interface
export interface Customer {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface Order {
  id: number;
  product: {
    id: number;
    name: string;
    has_variants: boolean;
  };
  product_name: string; // Direct product name field
  variant?: {
    id: number;
    color: string;
    size: string;
    custom_variant?: string;
  };
  quantity: number;
  unit_price: number;
  buy_price?: number; // Added buy_price field for profit calculation
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  sale_date: string;
  // New calculated fields for multiple items
  total_buy_price?: number;
  total_sell_price?: number;
  gross_profit?: number;
  net_profit?: number;
}

export interface OrderForm {
  product: number | "";
  variant: number | "";
  quantity: number;
  unit_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
}

export interface OrderStatistics {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  top_products: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

export interface OrderFilters {
  search: string;
  customer_filter: "all" | "with_customer" | "without_customer";
  date_from?: string;
  date_to?: string;
  product_id?: number;
}

export interface OrderSortOptions {
  field: "date" | "product" | "customer" | "amount" | "quantity";
  direction: "asc" | "desc";
}
