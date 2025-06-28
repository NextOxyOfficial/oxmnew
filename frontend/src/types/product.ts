// Product variant interface for managing different product variations
export interface ProductVariant {
  id: number;
  color?: string;
  size?: string;
  weight?: number;
  weight_unit?: 'g' | 'kg' | 'lb' | 'oz';
  custom_variant?: string;
  stock: number;
  price_adjustment?: number;
  sku_suffix?: string;
}

// Product interface for type safety across components
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  cost: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image?: string;
  description?: string;
  supplier?: string;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  buyPrice?: number;
  salePrice?: number;
  sold?: number;
}

// Purchase history interface
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
  type: 'add' | 'remove';
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
