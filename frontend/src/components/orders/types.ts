// Shared types for Orders editing UI
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
}

export interface PaymentEntry {
  id: string;
  method: "Cash" | "Cheque" | "Bkash" | "Nagad" | "Bank";
  amount: number;
}

export interface OrderItem {
  id: string;
  product: number;
  variant?: number;
  quantity: number;
  unit_price: number;
  buy_price: number;
  total: number;
  product_name: string;
  variant_details?: string;
}

export interface OrderForm {
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  discount_type: "percentage" | "flat";
  discount_percentage: number;
  discount_flat_amount: number;
  discount_amount: number;
  vat_percentage: number;
  vat_amount: number;
  due_amount: number;
  previous_due: number;
  apply_previous_due_to_total: boolean;
  total: number;
  due_date: string;
  notes: string;
  status:
    | "draft"
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refunded";
  payments: PaymentEntry[];
  total_payment_received: number;
  remaining_balance: number;
  employee_id?: number;
  incentive_amount: number;
  net_profit: number;
  total_buy_price: number;
  total_sell_price: number;
  gross_profit: number;
}
