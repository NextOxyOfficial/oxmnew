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
  product: number; // Product ID
  product_name: string; // Product name from serializer
  variant?: number; // Variant ID
  variant_display?: string; // Variant display string from serializer
  quantity: number;
  unit_price: number;
  buy_price?: number; // From serializer for profit calculation
  total_amount: number;
  profit?: number; // From serializer
  profit_margin?: number; // From serializer
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  sale_date: string;
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
