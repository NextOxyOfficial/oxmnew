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

// Purchase history interface
export interface PurchaseHistory {
  id: number;
  date: string;
  quantity: number;
  unitPrice: number;
  user: string;
  invoice: string;
}
