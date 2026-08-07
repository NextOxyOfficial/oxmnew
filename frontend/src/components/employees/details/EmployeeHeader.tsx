"use client";

import React from "react";
import { Employee, Incentive, Task } from "@/types/employee";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

interface EmployeeHeaderProps {
  employee: Employee;
  incentives: Incentive[];
  tasks: Task[];
}

export default function EmployeeHeader({ employee, incentives, tasks }: EmployeeHeaderProps) {
  const formatCurrencyWithSymbol = useCurrencyFormatter();

  const totalIncentives =
    incentives && incentives.length > 0
      ? incentives.reduce(
          (sum, incentive) =>
            sum + (parseFloat(incentive.amount.toString()) || 0),
          0
        )
      : 0;

  const completionRate =
    employee.tasks_assigned > 0
      ? (employee.tasks_completed / employee.tasks_assigned) * 100
      : 0;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled"
  ).length;

  return (
    <div className="stat-strip">
      <div className="stat">
        <div className="stat-label">মাসিক বেতন</div>
        <div className="stat-value num">
          {formatCurrencyWithSymbol(employee.salary)}
        </div>
        <div className="stat-meta">প্রতি মাসে</div>
      </div>

      <div className="stat">
        <div className="stat-label">কাজ শেষ</div>
        <div className="stat-value num">{completionRate.toFixed(0)}%</div>
        <div className="stat-meta">{pendingTasks} টা কাজ বাকি</div>
      </div>

      <div className="stat">
        <div className="stat-label">মোট ইনসেনটিভ</div>
        <div className="stat-value num money-pos">
          {formatCurrencyWithSymbol(totalIncentives)}
        </div>
        <div className="stat-meta">সব মিলিয়ে</div>
      </div>

      <div className="stat">
        <div className="stat-label">পদ</div>
        <div className="stat-value truncate" title={employee.role}>
          {employee.role}
        </div>
        <div className="stat-meta truncate" title={employee.department}>
          {employee.department}
        </div>
      </div>
    </div>
  );
}
