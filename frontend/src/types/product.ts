// Product interfaces for type safety across components

// Product variant interface
export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  weight?: number;
  weight_unit?: "g" | "kg" | "lb" | "oz";
  custom_variant?: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  profit?: number;
  profit_margin?: number;
  weight_display?: string;
  created_at?: string;
  updated_at?: string;
}

// Product photo interface
export interface ProductPhoto {
  id: number;
  image: string;
  alt_text?: string;
  order: number;
  created_at: string;
}

// Product interface
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
  buy_price: number;
  sell_price: number;
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
}

// Product form data for creation/editing
export interface ProductFormData {
  name: string;
  buyPrice: number;
  sellPrice: number;
  category: string;
  supplier: string;
  location: string;
  details: string;
  photos: File[];
  hasVariants: boolean;
  colorSizeVariants: ProductVariant[];
}

// Product sale interface
export interface ProductSale {
  id: number;
  product: number;
  product_name: string;
  variant?: number;
  variant_display?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  sale_date: string;
}

// Stock movement interface
export interface ProductStockMovement {
  id: number;
  product: number;
  product_name: string;
  variant?: number;
  variant_display?: string;
  movement_type: "in" | "out" | "adjustment" | "sale" | "return";
  movement_type_display: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  notes?: string;
  created_at: string;
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
