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
  console.log("OrdersStats re-rendered");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Orders */}
      <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="rounded-md bg-cyan-500/20 p-1.5">
            <svg
              className="h-7 w-7 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-cyan-300 font-medium">Total Orders</p>
            {isStatsLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-5 bg-cyan-600/30 rounded w-12"></div>
                <div className="h-3 bg-cyan-600/20 rounded w-24"></div>
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-cyan-400">
                  {overallStats.totalOrders}
                </p>
                <p className="text-xs text-cyan-500 opacity-80">
                  All completed orders
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="rounded-md bg-green-500/20 p-1.5">
            <svg
              className="h-7 w-7 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-green-300 font-medium">Total Revenue</p>
            {isStatsLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-5 bg-green-600/30 rounded w-16"></div>
                <div className="h-3 bg-green-600/20 rounded w-28"></div>
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-green-400">
                  {formatCurrency(overallStats.totalRevenue || 0)}
                </p>
                <p className="text-xs text-green-500 opacity-80">
                  Total sales income
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Total Profit */}
      <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/8 border border-blue-500/25 rounded-lg p-2.5 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="rounded-md bg-blue-500/20 p-1.5">
            <svg
              className="h-7 w-7 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-blue-300 font-medium">Total Profit</p>
            {isStatsLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-5 bg-blue-600/30 rounded w-16"></div>
                <div className="h-3 bg-blue-600/20 rounded w-28"></div>
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-blue-400">
                  {formatCurrency(overallStats.totalProfit || 0)}
                </p>
                <p className="text-xs text-blue-500 opacity-80">
                  Revenue minus cost
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today's Orders */}
      <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/8 border border-yellow-500/25 rounded-lg p-2.5 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="rounded-md bg-yellow-500/20 p-1.5">
            <svg
              className="h-7 w-7 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-yellow-300 font-medium">Today</p>
            {isStatsLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-5 bg-yellow-600/30 rounded w-8"></div>
                <div className="h-3 bg-yellow-600/20 rounded w-20"></div>
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-yellow-400">
                  {overallStats.todaysOrders}
                </p>
                <p className="text-xs text-yellow-500 opacity-80">
                  {formatCurrency(overallStats.todaysRevenue || 0)} revenue
                </p>
              </>
            )}
          </div>
        </div>
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
