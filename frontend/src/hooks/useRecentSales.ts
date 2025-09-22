import { ApiService } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

// Define the Sale interface for type safety
export interface Sale {
  id: number;
  product: number;
  product_name?: string;
  variant?: number;
  variant_display?: string;
  quantity: number;
  unit_price: number;
  buy_price: number;
  total_amount: number;
  profit: number;
  profit_margin: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  sale_date: string;
  status?: string; // Add status field
  // New fields for multiple items support
  items?: OrderItem[];
  gross_profit?: number;
  net_profit?: number;
  total_buy_price?: number;
  total_sell_price?: number;
}

// Order item interface
export interface OrderItem {
  id?: number;
  product_name: string;
  variant_details?: string;
  quantity: number;
  unit_price: number;
  buy_price: number;
  total_price?: number;
}

// For backward compatibility
export interface LegacySale {
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
  fetchSalesWithFilter: (filter: {
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export const useRecentSales = (limit: number = 5): UseRecentSalesReturn => {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);

  const fetchRecentSales = useCallback(
    async (filters?: {
      dateFilter?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      try {
        setIsLoadingSales(true);
        setSalesError(null);

        const params: {
          ordering: string;
          page_size: number;
          date_filter?: string;
          start_date?: string;
          end_date?: string;
        } = {
          ordering: "-sale_date",
          page_size: limit,
        };

        // Add date filters if provided
        if (filters?.dateFilter) {
          params.date_filter = filters.dateFilter;
        }
        if (filters?.startDate) {
          params.start_date = filters.startDate;
        }
        if (filters?.endDate) {
          params.end_date = filters.endDate;
        }

        console.log("Fetching sales with params:", params);
        console.log("Fetching sales with params:", params);
        const salesData = await ApiService.getSales(params);
        console.log("Sales data received:", salesData);
        console.log("Sales data received:", salesData);

        // Extract results from the paginated response
        const salesResults = salesData.results || salesData;

        // Sort by sale date (most recent first) and limit to specified number
        const sortedSales = salesResults
          .sort(
            (a: Sale, b: Sale) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
          )
          .slice(0, limit);

        setRecentSales(sortedSales);
      } catch (error) {
        console.error("Error fetching recent sales:", error);
        setSalesError("Failed to load recent sales");
      } finally {
        setIsLoadingSales(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    // Load initial data - dashboard will override with filter if needed
    fetchRecentSales();
  }, [fetchRecentSales]);

  return {
    recentSales,
    isLoadingSales,
    salesError,
    refetchSales: () => fetchRecentSales(),
    fetchSalesWithFilter: fetchRecentSales,
  };
};
