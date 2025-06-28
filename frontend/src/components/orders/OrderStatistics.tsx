"use client";

import { useState, useEffect, useCallback } from "react";
import { Order } from "@/types/order";

interface OrderStatistics {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
}

interface OrderStatsProps {
  orders: Order[];
}

export default function OrderStatistics({ orders }: OrderStatsProps) {
  const [stats, setStats] = useState<OrderStatistics>({
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0,
    orders_today: 0,
    orders_this_week: 0,
    orders_this_month: 0,
  });

  const calculateStatistics = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const total_orders = orders.length;
    const total_revenue = orders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    const average_order_value =
      total_orders > 0 ? total_revenue / total_orders : 0;

    const orders_today = orders.filter((order) => {
      const orderDate = new Date(order.sale_date);
      return orderDate >= today;
    }).length;

    const orders_this_week = orders.filter((order) => {
      const orderDate = new Date(order.sale_date);
      return orderDate >= weekStart;
    }).length;

    const orders_this_month = orders.filter((order) => {
      const orderDate = new Date(order.sale_date);
      return orderDate >= monthStart;
    }).length;

    setStats({
      total_orders,
      total_revenue,
      average_order_value,
      orders_today,
      orders_this_week,
      orders_this_month,
    });
  }, [orders]);

  useEffect(() => {
    calculateStatistics();
  }, [calculateStatistics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-cyan-400"
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
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                Total Orders
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-slate-100">
                  {stats.total_orders}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-green-400"
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
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                Total Revenue
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-slate-100">
                  {formatCurrency(stats.total_revenue)}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                Avg. Order Value
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-slate-100">
                  {formatCurrency(stats.average_order_value)}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-yellow-400"
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
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                Today
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-slate-100">
                  {stats.orders_today}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                This Week
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-slate-100">
                  {stats.orders_this_week}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                This Month
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-slate-100">
                  {stats.orders_this_month}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
