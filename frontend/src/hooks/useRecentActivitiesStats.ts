import { useMemo } from "react";
import { Sale } from "./useRecentSales";

interface RecentActivitiesStats {
  totalBuyPrice: number;
  totalSellPrice: number;
  totalProfit: number;
  profitMargin: number;
  salesCount: number;
}

export function useRecentActivitiesStats(sales: Sale[]): RecentActivitiesStats {
  return useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        totalBuyPrice: 0,
        totalSellPrice: 0,
        totalProfit: 0,
        profitMargin: 0,
        salesCount: 0,
      };
    }

    const totalBuyPrice = sales.reduce((total, sale) => {
      return total + sale.buy_price * sale.quantity;
    }, 0);

    const totalSellPrice = sales.reduce((total, sale) => {
      return total + sale.total_amount;
    }, 0);

    const totalProfit = sales.reduce((total, sale) => {
      return total + sale.profit;
    }, 0);

    const profitMargin =
      totalSellPrice > 0 ? (totalProfit / totalSellPrice) * 100 : 0;

    return {
      totalBuyPrice,
      totalSellPrice,
      totalProfit,
      profitMargin,
      salesCount: sales.length,
    };
  }, [sales]);
}
