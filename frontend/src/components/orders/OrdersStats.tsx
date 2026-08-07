"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import React from "react";

interface OrdersStatsProps {
  overallStats: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    todaysOrders: number;
    todaysRevenue: number;
  };
  isStatsLoading: boolean;
}

const OrdersStats: React.FC<OrdersStatsProps> = ({
  overallStats,
  isStatsLoading,
}) => {
  const formatCurrency = useCurrencyFormatter();

  return (
    <div className="stat-strip">
      {/* Total Orders */}
      <div className="stat">
        <div className="stat-label">মোট অর্ডার</div>
        {isStatsLoading ? (
          <div className="animate-pulse space-y-1 mt-1">
            <div className="h-5 w-12 rounded bg-slate-100"></div>
            <div className="h-3 w-20 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div className="stat-value num">{overallStats.totalOrders}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </>
        )}
      </div>

      {/* Total Revenue */}
      <div className="stat">
        <div className="stat-label">মোট বিক্রি</div>
        {isStatsLoading ? (
          <div className="animate-pulse space-y-1 mt-1">
            <div className="h-5 w-16 rounded bg-slate-100"></div>
            <div className="h-3 w-24 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div className="stat-value money-pos">
              {formatCurrency(overallStats.totalRevenue || 0)}
            </div>
            <div className="stat-meta">বিক্রি থেকে আসা টাকা</div>
          </>
        )}
      </div>

      {/* Total Profit */}
      <div className="stat">
        <div className="stat-label">মোট লাভ</div>
        {isStatsLoading ? (
          <div className="animate-pulse space-y-1 mt-1">
            <div className="h-5 w-16 rounded bg-slate-100"></div>
            <div className="h-3 w-24 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div className="stat-value num">
              {formatCurrency(overallStats.totalProfit || 0)}
            </div>
            <div className="stat-meta">বিক্রি বাদে খরচ</div>
          </>
        )}
      </div>

      {/* Today's Orders */}
      <div className="stat">
        <div className="stat-label">আজকের অর্ডার</div>
        {isStatsLoading ? (
          <div className="animate-pulse space-y-1 mt-1">
            <div className="h-5 w-8 rounded bg-slate-100"></div>
            <div className="h-3 w-20 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div className="stat-value num">{overallStats.todaysOrders}</div>
            <div className="stat-meta">
              আজকে বিক্রি {formatCurrency(overallStats.todaysRevenue || 0)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(OrdersStats, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.overallStats === nextProps.overallStats &&
    prevProps.isStatsLoading === nextProps.isStatsLoading
  );
});
