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
      const displayName = `${selectedEmployee.name} - ${selectedEmployee.role || selectedEmployee.department || "Employee"}`;
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
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
      <div className="sm:p-4 p-2">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-sm font-medium text-orange-400 mb-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
          <span>Sales Incentive (Internal)</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="space-y-3">
            {/* Display selected employee info */}
            {selectedEmployee && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-cyan-300 text-sm font-medium">
                      Selected: {selectedEmployee.name || 'Unknown'} ({selectedEmployee.employee_id || `EMP${selectedEmployee.id}`})
                    </p>
                    <p className="text-cyan-400 text-xs">
                      {selectedEmployee.role || selectedEmployee.department || 'Employee'} • {selectedEmployee.email || 'No email'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Employee</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and select employee..."
                  value={employeeSearch}
                  onChange={(e) => { 
                    setEmployeeSearch(e.target.value); 
                    setIsEmployeeDropdownOpen(true); 
                  }}
                  onFocus={() => setIsEmployeeDropdownOpen(true)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                />

                {employeeSearch && (
                  <button
                    type="button"
                    onClick={() => { setEmployeeSearch(""); setOrderForm((prev) => ({ ...prev, employee_id: undefined })); setIsEmployeeDropdownOpen(false); }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-700/50"
                    title="Clear search"
                  >
                    Clear
                  </button>
                )}

                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {isEmployeeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                    {/* No employee option */}
                    <div 
                      onClick={() => { 
                        setOrderForm((prev) => ({ ...prev, employee_id: undefined })); 
                        setEmployeeSearch(""); 
                        setIsEmployeeDropdownOpen(false); 
                      }} 
                      className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 text-slate-400 text-sm"
                    >
                      No employee selected
                    </div>
                    
                    {/* Employee list */}
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <div 
                          key={employee.id} 
                          onClick={() => { 
                            console.log('Selecting employee:', employee);
                            setOrderForm((prev) => ({ ...prev, employee_id: employee.id })); 
                            setEmployeeSearch(`${employee.name} - ${employee.role || employee.department || "Employee"}`); 
                            setIsEmployeeDropdownOpen(false); 
                          }} 
                          className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                        >
                          <div className="text-white font-medium text-sm">{employee.name}</div>
                          <div className="text-slate-400 text-sm">
                            {employee.role || employee.department || 'Employee'} • {employee.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-slate-400 text-sm">
                        {employees.length === 0 ? "No employees loaded" : "No employees match your search"}
                      </div>
                    )}
                  </div>
                )}

                {isEmployeeDropdownOpen && <div className="fixed inset-0 z-5" onClick={() => setIsEmployeeDropdownOpen(false)} />}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Incentive Amount</label>
              <input
                type="number"
                value={orderForm.incentive_amount === 0 ? "" : orderForm.incentive_amount}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, incentive_amount: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                placeholder="0.00"
                min="0"
                step="0.01"
              />

              {orderForm.employee_id && orderForm.incentive_amount > 0 && (
                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-400 text-sm font-medium">Incentive will be recorded</p>
                      <p className="text-green-300 text-xs">{formatCurrency(orderForm.incentive_amount)} incentive will be given to the selected employee when the order is saved.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {orderForm.employee_id && orderForm.incentive_amount === 0 && (
              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-amber-400 text-sm">Employee selected but no incentive amount set. Enter an amount above to create an incentive.</p>
                </div>
              </div>
            )}

            {/* Profit Summary - Internal Details */}
            {orderForm.total > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">
                    Total Buy Price:
                  </span>
                  <span className="text-sm text-red-400">
                    {formatCurrency(orderForm.total_buy_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">
                    Total Sell Price:
                  </span>
                  <span className="text-sm text-blue-400">
                    {formatCurrency(orderForm.total_sell_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-700/30">
                  <span className="text-sm text-slate-400">
                    Gross Profit:
                  </span>
                  <span className="text-sm text-green-400">
                    {formatCurrency(orderForm.gross_profit)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">
                    Incentive:
                  </span>
                  <span className="text-sm text-orange-400">
                    -{formatCurrency(orderForm.incentive_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                  <span className="text-sm text-slate-300">
                    {orderForm.net_profit < 0
                      ? "Net Loss:"
                      : "Net Profit:"}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      orderForm.net_profit < 0
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {orderForm.net_profit < 0
                      ? formatCurrency(
                          Math.abs(orderForm.net_profit)
                        )
                      : formatCurrency(orderForm.net_profit)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
