// Product interface for type safety across components
export interface Product {
  id: number;
  name: string;
  category?: number;
  category_name?: string;
  supplier?: number;
  supplier_name?: string;
  location: string;
  details?: string;
  has_variants: boolean;
  buy_price?: number;
  sell_price?: number;
  stock: number;
  total_stock?: number;
  average_buy_price?: number;
  average_sell_price?: number;
  profit_margin?: number;
  variant_count?: number;
  main_photo?: string;
  variants?: ProductVariant[];
  photos?: ProductPhoto[];
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Backend calculated totals for variant products
  total_buy_price?: number;
  total_sell_price?: number;
  total_profit?: number;
  total_quantity?: number;

  // Legacy fields for backward compatibility
  sku?: string;
  price?: number;
  cost?: number;
  status?: string;
  buyPrice?: number;
  salePrice?: number;
  sold?: number;
}

export interface ProductVariant {
  id: number;
  color?: string;
  size?: string;
  weight?: number;
  weight_unit?: string;
  custom_variant?: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  sku_suffix?: string;
  // Additional pricing fields that might come from API
  cost?: number;
  price?: number;
  price_adjustment?: number;
}

export interface ProductPhoto {
  id: number;
  image: string;
  order: number;
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
  // Backend fields
  movement_type?: string;
  movement_type_display?: string;
  previous_stock?: number;
  new_stock?: number;
  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  // Legacy fields for backward compatibility
  date?: string;
  unitPrice?: number;
  invoice?: string;
}
