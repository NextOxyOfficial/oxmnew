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

  const MAX_PAGE_SIZE = 2000;

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
          _t?: number; // Cache buster
        } = {
          ordering: "-sale_date",
          // When date filtering is applied, get more results within the range
          // For all_time filter, get even more results to show everything
          page_size: filters?.dateFilter === "all_time"
            ? MAX_PAGE_SIZE
            : (filters?.dateFilter && filters.dateFilter !== "all") ||
              filters?.startDate ||
              filters?.endDate
            ? MAX_PAGE_SIZE
            : limit,
          _t: Date.now(), // Add timestamp to prevent caching
        };

        // Add date filters if provided
        if (filters?.dateFilter && filters.dateFilter !== 'all_time') {
          // Use the backend's date_filter parameter for preset filters
          // Don't send all_time to backend - let it return all records
          params.date_filter = filters.dateFilter;
        }
        if (filters?.startDate) {
          params.start_date = filters.startDate;
        }
        if (filters?.endDate) {
          params.end_date = filters.endDate;
        }

        console.log("=== RECENT SALES DEBUG ===");
        console.log("Input filters received:", filters);
        console.log("Using page_size:", params.page_size, filters?.dateFilter ? `(expanded for date filter: ${filters.dateFilter})` : "(default limit)");
        console.log("Date filter processing:", filters?.dateFilter === 'all_time' ? 'all_time detected - not sending to backend' : `sending ${filters?.dateFilter} to backend`);
        console.log("Fetching sales with params:", params);
        console.log("API endpoint will be: /sales/ with params:", params);
        
        const salesData = await ApiService.getProductSalesWithPagination(params);
        
        console.log("Sales data received:", salesData);
        console.log("Number of sales returned:", salesData?.results?.length || salesData?.length || 0);
        console.log("Sales dates in response:", salesData?.results?.map((s: any) => ({
          id: s.id, 
          sale_date: s.sale_date || s.created_at,
          order_number: s.order_number
        })) || []);

        // Extract results from the paginated response
        const salesResults = salesData.results || salesData;

        // Sort by sale date (most recent first)
        const sortedSales = salesResults
          .sort(
            (a: Sale, b: Sale) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
          );

        // Only slice to limit if no filters are applied (default view)
        const finalSales = (filters?.dateFilter || filters?.startDate || filters?.endDate) 
          ? sortedSales 
          : sortedSales.slice(0, limit);

        console.log("Final sales count after processing:", finalSales.length);
        console.log("Filter applied:", !!filters?.dateFilter, "Date range:", !!filters?.startDate, !!filters?.endDate);

        setRecentSales(finalSales);
      } catch (error) {
        console.error("Error fetching recent sales:", error);
        setSalesError("Failed to load recent sales");
      } finally {
        setIsLoadingSales(false);
      }
    },
    [limit]
  );

  // Removed auto-fetch on mount - let the parent component control when to fetch
  // This prevents race conditions with filter initialization
  // useEffect(() => {
  //   fetchRecentSales();
  // }, [fetchRecentSales]);

  return {
    recentSales,
    isLoadingSales,
    salesError,
    refetchSales: () => fetchRecentSales(),
    fetchSalesWithFilter: fetchRecentSales,
  };
};
