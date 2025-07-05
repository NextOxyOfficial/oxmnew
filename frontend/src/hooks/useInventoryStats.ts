import { useState, useEffect } from "react";
import { ApiService } from "@/lib/api";

interface InventoryStats {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_buy_value: number;
  total_sell_value: number;
  top_categories: Array<{
    category__name: string;
    count: number;
  }>;
}

export function useInventoryStats() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.getInventoryStats();
      setStats(response);
    } catch (err) {
      console.error("Error fetching inventory stats:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch inventory statistics"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
