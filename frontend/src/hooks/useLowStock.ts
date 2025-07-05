import { useState, useEffect } from "react";
import { ApiService } from "@/lib/api";

// Product interfaces
export interface ProductVariant {
  id?: number;
  color: string;
  size: string;
  weight?: number;
  weight_unit?: string;
  custom_variant?: string;
  buy_price: number;
  sell_price: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  category?: number;
  supplier?: number;
  location?: string;
  details?: string;
  has_variants: boolean;
  buy_price: number;
  sell_price: number;
  stock: number;
  variants?: ProductVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseLowStockReturn {
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  isLoadingStock: boolean;
  stockError: string | null;
  refetchStock: () => void;
}

export const useLowStock = (threshold: number = 10): UseLowStockReturn => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [stockError, setStockError] = useState<string | null>(null);

  const fetchStockData = async () => {
    try {
      setIsLoadingStock(true);
      setStockError(null);

      // Fetch low stock and out of stock products in parallel
      const [lowStockResponse, outOfStockResponse] = await Promise.all([
        ApiService.getLowStockProducts(threshold),
        ApiService.getOutOfStockProducts(),
      ]);

      setLowStockProducts(lowStockResponse.results);
      setOutOfStockProducts(outOfStockResponse.results);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setStockError("Failed to load stock information");
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  return {
    lowStockProducts,
    outOfStockProducts,
    isLoadingStock,
    stockError,
    refetchStock: fetchStockData,
  };
};
