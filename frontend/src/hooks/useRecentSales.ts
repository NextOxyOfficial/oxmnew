import { useState, useEffect } from "react";
import { ApiService } from "@/lib/api";

// Define the Sale interface for type safety
export interface Sale {
  id: number;
  product: number;
  product_name?: string;
  variant?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UseRecentSalesReturn {
  recentSales: Sale[];
  isLoadingSales: boolean;
  salesError: string | null;
  refetchSales: () => void;
}

export const useRecentSales = (limit: number = 5): UseRecentSalesReturn => {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);

  const fetchRecentSales = async () => {
    try {
      setIsLoadingSales(true);
      setSalesError(null);
      const salesData = await ApiService.getProductSales();

      // Sort by creation date (most recent first) and limit to specified number
      const sortedSales = salesData
        .sort(
          (a: Sale, b: Sale) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, limit);

      setRecentSales(sortedSales);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      setSalesError("Failed to load recent sales");
    } finally {
      setIsLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchRecentSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return {
    recentSales,
    isLoadingSales,
    salesError,
    refetchSales: fetchRecentSales,
  };
};
