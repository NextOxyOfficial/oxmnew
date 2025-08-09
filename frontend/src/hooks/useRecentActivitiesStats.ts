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

    console.log("Recent Activities Stats - Raw sales data:", sales);

    const totalBuyPrice = sales.reduce((total, sale) => {
      // Use total_buy_price if available (for multi-item orders), otherwise calculate from single item
      const buyPrice =
        parseFloat(sale.total_buy_price?.toString() || "0") ||
        parseFloat(sale.buy_price?.toString() || "0") *
          parseFloat(sale.quantity?.toString() || "0");
      console.log(
        `Sale ${sale.id}: total_buy_price=${sale.total_buy_price}, calculated=${
          sale.buy_price * sale.quantity
        }, using=${buyPrice}`
      );
      return total + buyPrice;
    }, 0);

    const totalSellPrice = sales.reduce((total, sale) => {
      const amount = parseFloat(sale.total_amount?.toString() || "0");
      console.log(
        `Sale ${sale.id}: total_amount=${sale.total_amount}, parsed=${amount}`
      );
      return total + amount;
    }, 0);

    const totalProfit = sales.reduce((total, sale) => {
      // Use gross_profit if available (for multi-item orders), otherwise use profit
      const profit =
        parseFloat(sale.gross_profit?.toString() || "0") ||
        parseFloat(sale.profit?.toString() || "0");
      console.log(
        `Sale ${sale.id}: gross_profit=${sale.gross_profit}, profit=${sale.profit}, using=${profit}`
      );
      return total + profit;
    }, 0);

    const profitMargin =
      totalSellPrice > 0 ? (totalProfit / totalSellPrice) * 100 : 0;

    console.log("Recent Activities Stats - Calculated totals:", {
      totalBuyPrice,
      totalSellPrice,
      totalProfit,
      profitMargin,
      salesCount: sales.length,
    });

    return {
      totalBuyPrice,
      totalSellPrice,
      totalProfit,
      profitMargin,
      salesCount: sales.length,
    };
  }, [sales]);
}
