/** Shapes shared by the add-product screen and its sub-components. */

export interface SuggestionProduct {
  id: number;
  name: string;
  product_code?: string;
  stock?: number;
  total_stock?: number;
  sell_price?: number;
  average_sell_price?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ColorSize {
  id: string;
  color: string;
  size: string;
  weight?: number;
  weight_unit?: "g" | "kg" | "lb" | "oz";
  custom_variant?: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

export interface ProductFormData {
  name: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  category: number | "";
  supplier: number | "";
  productCode: string;
  location: string;
  details: string;
  photos: File[];
  hasVariants: boolean;
  noStockRequired: boolean;
  colorSizeVariants: ColorSize[];
}
