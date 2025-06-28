// Product interface for type safety across components
export interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  buyPrice: number;
  salePrice: number;
  sold: number;
}

// Product statistics interface
export interface ProductStatistics {
  total_products: number;
  active_products: number;
  products_with_variants: number;
  total_stock: number;
  total_inventory_value: number;
  low_stock_count: number;
  low_stock_products: Array<{
    product: string;
    variant?: string;
    stock: number;
  }>;
}

// Legacy interfaces for backward compatibility
export interface PurchaseHistory {
  id: number;
  date: string;
  quantity: number;
  unitPrice: number;
  user: string;
  invoice: string;
}

// Stock history interface for tracking stock movements
export interface StockEntry {
  id: number;
  quantity: number;
  type: "add" | "remove";
  reason: string;
  cost_per_unit?: number;
  total_cost?: number;
  notes?: string;
  variant_id?: number;
  variant_details?: string;
  created_at: string;
  created_by: string;
  // Legacy fields for backward compatibility
  date?: string;
  unitPrice?: number;
  user?: string;
  invoice?: string;
}
