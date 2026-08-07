"use client";

import { OrderForm } from "../types";
import { useEffect, useMemo } from "react";

interface Employee {
  id: number;
  name: string;
  email: string;
  department?: string;
  role?: string;
  employee_id?: string;
}

type Props = {
  orderForm: OrderForm;
  setOrderForm: (updater: (prev: OrderForm) => OrderForm) => void;
  employees: Employee[];
  isEmployeeDropdownOpen: boolean;
  setIsEmployeeDropdownOpen: (v: boolean) => void;
  employeeSearch: string;
  setEmployeeSearch: (v: string) => void;
  formatCurrency: (v: number) => string;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

export default function SalesIncentive({ orderForm, setOrderForm, employees, isEmployeeDropdownOpen, setIsEmployeeDropdownOpen, employeeSearch, setEmployeeSearch, formatCurrency, isOpen, setIsOpen }: Props) {

  // Find the selected employee
  const selectedEmployee = useMemo(() =>
    employees.find(e => e.id === orderForm.employee_id),
    [employees, orderForm.employee_id]
  );

  // Auto-populate employee search when order loads and employees are available
  useEffect(() => {
    console.log('Employee sync:', {
      employee_id: orderForm.employee_id,
      employees_count: employees.length,
      selectedEmployee: selectedEmployee ? `${selectedEmployee.name} (ID: ${selectedEmployee.id})` : 'Not found',
      currentSearch: employeeSearch
    });

    // Only auto-populate if we have an employee ID, found the employee, and search is empty
    if (orderForm.employee_id && selectedEmployee && !employeeSearch) {
      const displayName = `${selectedEmployee.name} - ${selectedEmployee.role || selectedEmployee.department || "কর্মচারী"}`;
      console.log('Setting employee search to:', displayName);
      setEmployeeSearch(displayName);
    }
  }, [orderForm.employee_id, selectedEmployee, employees.length, employeeSearch, setEmployeeSearch]);

  // Filter employees based on search (simple and reliable)
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const search = employeeSearch.toLowerCase();
    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      (employee.role && employee.role.toLowerCase().includes(search)) ||
      (employee.department && employee.department.toLowerCase().includes(search))
    );
  }, [employees, employeeSearch]);

  return (
    <div className="plane-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="section-title mb-0">সেলস ইনসেনটিভ (নিজেদের হিসাব)</span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-3 mt-3">
          {/* Display selected employee info */}
          {selectedEmployee && (
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-cyan-700 text-sm font-medium">
                সিলেক্ট করা: {selectedEmployee.name || 'নাম নেই'} ({selectedEmployee.employee_id || `EMP${selectedEmployee.id}`})
              </p>
              <p className="text-cyan-700 text-xs">
                {selectedEmployee.role || selectedEmployee.department || 'কর্মচারী'} • {selectedEmployee.email || 'ইমেইল নেই'}
              </p>
            </div>
          )}

          <div>
            <label className="label">কর্মচারী</label>
            <div className="relative">
              <input
                type="text"
                placeholder="কর্মচারী খুঁজে সিলেক্ট করুন…"
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setIsEmployeeDropdownOpen(true);
                }}
                onFocus={() => setIsEmployeeDropdownOpen(true)}
                className="input pr-20"
              />

              {employeeSearch && (
                <button
                  type="button"
                  onClick={() => { setEmployeeSearch(""); setOrderForm((prev) => ({ ...prev, employee_id: undefined })); setIsEmployeeDropdownOpen(false); }}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 transition-colors px-1.5 py-1 rounded hover:bg-slate-100"
                  title="খোঁজা মুছে দিন"
                >
                  মুছুন
                </button>
              )}

              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>

              {isEmployeeDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {/* No employee option */}
                  <div
                    onClick={() => {
                      setOrderForm((prev) => ({ ...prev, employee_id: undefined }));
                      setEmployeeSearch("");
                      setIsEmployeeDropdownOpen(false);
                    }}
                    className="p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 text-slate-500 text-sm"
                  >
                    কোনো কর্মচারী নয়
                  </div>

                  {/* Employee list */}
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => {
                          console.log('Selecting employee:', employee);
                          setOrderForm((prev) => ({ ...prev, employee_id: employee.id }));
                          setEmployeeSearch(`${employee.name} - ${employee.role || employee.department || "কর্মচারী"}`);
                          setIsEmployeeDropdownOpen(false);
                        }}
                        className="p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 last:border-b-0"
                      >
                        <div className="text-slate-900 font-medium text-sm">{employee.name}</div>
                        <div className="text-slate-500 text-xs">
                          {employee.role || employee.department || 'কর্মচারী'} • {employee.email}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-slate-500 text-sm">
                      {employees.length === 0 ? "কোনো কর্মচারী লোড হয়নি" : "খোঁজার সাথে মেলে এমন কর্মচারী নেই"}
                    </div>
                  )}
                </div>
              )}

              {isEmployeeDropdownOpen && <div className="fixed inset-0 z-5" onClick={() => setIsEmployeeDropdownOpen(false)} />}
            </div>
          </div>

          <div>
            <label className="label">ইনসেনটিভের টাকা</label>
            <input
              type="number"
              value={orderForm.incentive_amount === 0 ? "" : orderForm.incentive_amount}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, incentive_amount: parseFloat(e.target.value) || 0 }))}
              className="input"
              placeholder="0.00"
              min="0"
              step="0.01"
            />

            {orderForm.employee_id && orderForm.incentive_amount > 0 && (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                <p className="text-emerald-700 text-sm font-medium">ইনসেনটিভ হিসাবে জমা হবে</p>
                <p className="text-emerald-700 text-xs">অর্ডার সেভ করলে সিলেক্ট করা কর্মচারী {formatCurrency(orderForm.incentive_amount)} ইনসেনটিভ পাবেন।</p>
              </div>
            )}
          </div>

          {orderForm.employee_id && orderForm.incentive_amount === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
              <p className="text-amber-700 text-sm">কর্মচারী সিলেক্ট করা হয়েছে কিন্তু ইনসেনটিভের টাকা দেওয়া হয়নি। উপরে টাকার পরিমাণ লিখুন।</p>
            </div>
          )}

          {/* Profit Summary - Internal Details */}
          {orderForm.total > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">মোট কেনা দাম</span>
                <span className="money-neg">{formatCurrency(orderForm.total_buy_price)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">মোট বিক্রির দাম</span>
                <span className="num text-slate-900">{formatCurrency(orderForm.total_sell_price)}</span>
              </div>
              <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500">মোট লাভ</span>
                <span className="money-pos">{formatCurrency(orderForm.gross_profit)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">ইনসেনটিভ</span>
                <span className="money-neg">-{formatCurrency(orderForm.incentive_amount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-600">
                  {orderForm.net_profit < 0 ? "নিট লোকসান" : "নিট লাভ"}
                </span>
                <span className={`font-semibold ${orderForm.net_profit < 0 ? "money-neg" : "money-pos"}`}>
                  {orderForm.net_profit < 0
                    ? formatCurrency(Math.abs(orderForm.net_profit))
                    : formatCurrency(orderForm.net_profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
