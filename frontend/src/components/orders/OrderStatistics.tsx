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
    <div className="stat-strip">
      <div className="stat">
        <div className="stat-label">মোট অর্ডার</div>
        <div className="stat-value num">{stats.total_orders}</div>
      </div>

      <div className="stat">
        <div className="stat-label">মোট বিক্রি</div>
        <div className="stat-value money-pos">
          {formatCurrency(stats.total_revenue)}
        </div>
      </div>

      <div className="stat">
        <div className="stat-label">গড় অর্ডার</div>
        <div className="stat-value num">
          {formatCurrency(stats.average_order_value)}
        </div>
      </div>

      <div className="stat">
        <div className="stat-label">আজকে</div>
        <div className="stat-value num">{stats.orders_today}</div>
      </div>

      <div className="stat">
        <div className="stat-label">এই সপ্তাহে</div>
        <div className="stat-value num">{stats.orders_this_week}</div>
      </div>

      <div className="stat">
        <div className="stat-label">এই মাসে</div>
        <div className="stat-value num">{stats.orders_this_month}</div>
      </div>
    </div>
  );
}
