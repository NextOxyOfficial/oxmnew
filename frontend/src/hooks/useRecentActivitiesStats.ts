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
      // Prioritize total_buy_price from Order model (for multi-item orders)
      const buyPrice = parseFloat(sale.total_buy_price?.toString() || "0");
      
      // Fallback to calculated value for single-item backward compatibility
      if (buyPrice === 0) {
        const fallbackBuyPrice = parseFloat(sale.buy_price?.toString() || "0") *
          parseFloat(sale.quantity?.toString() || "0");
        console.log(
          `Sale ${sale.id}: using fallback buy price calculation: ${sale.buy_price} × ${sale.quantity} = ${fallbackBuyPrice}`
        );
        return total + fallbackBuyPrice;
      }
      
      console.log(`Sale ${sale.id}: using total_buy_price=${buyPrice}`);
      return total + buyPrice;
    }, 0);

    const totalSellPrice = sales.reduce((total, sale) => {
      // Prioritize total_sell_price from Order model
      const sellPrice = parseFloat(sale.total_sell_price?.toString() || "0");
      
      // Fallback to total_amount for backward compatibility
      if (sellPrice === 0) {
        const fallbackSellPrice = parseFloat(sale.total_amount?.toString() || "0");
        console.log(`Sale ${sale.id}: using fallback total_amount=${fallbackSellPrice}`);
        return total + fallbackSellPrice;
      }
      
      console.log(`Sale ${sale.id}: using total_sell_price=${sellPrice}`);
      return total + sellPrice;
    }, 0);

    const totalProfit = sales.reduce((total, sale) => {
      // Prioritize gross_profit from Order model (most accurate for multi-item orders)
      const profit = parseFloat(sale.gross_profit?.toString() || "0");
      
      // Fallback to old profit field for backward compatibility
      if (profit === 0) {
        const fallbackProfit = parseFloat(sale.profit?.toString() || "0");
        console.log(`Sale ${sale.id}: using fallback profit=${fallbackProfit}`);
        return total + fallbackProfit;
      }
      
      console.log(`Sale ${sale.id}: using gross_profit=${profit}`);
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
