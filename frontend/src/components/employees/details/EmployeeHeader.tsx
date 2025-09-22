"use client";

import React from "react";
import { ArrowLeft, User, Mail, Phone, DollarSign, CheckCircle2, TrendingUp } from "lucide-react";
import { Employee, Incentive, Task } from "@/types/employee";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

interface EmployeeHeaderProps {
  employee: Employee;
  incentives: Incentive[];
  tasks: Task[];
  onBack: () => void;
}

export default function EmployeeHeader({ employee, incentives, tasks, onBack }: EmployeeHeaderProps) {
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
    <div className="space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Employees</span>
        </button>
      </div>

      {/* Employee Header */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-white text-2xl font-bold">
                {employee.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {employee.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-slate-300">
                <User className="w-4 h-4" />
                <span className="text-sm">{employee.role}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{employee.email}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{employee.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-5xl">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-300/80 text-sm">Monthly Salary</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrencyWithSymbol(employee.salary)}
              </p>
            </div>
            <DollarSign className="h-7 w-7 text-cyan-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300/80 text-sm">Task Completion</p>
              <p className="text-xl font-bold text-purple-400 mt-1">
                {completionRate.toFixed(0)}%
              </p>
              <p className="text-xs text-purple-300/60 mt-1">
                {pendingTasks} pending tasks
              </p>
            </div>
            <CheckCircle2 className="h-7 w-7 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300/80 text-sm">Total Incentives</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">
                {formatCurrencyWithSymbol(totalIncentives)}
              </p>
            </div>
            <TrendingUp className="h-7 w-7 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
