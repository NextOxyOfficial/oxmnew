"use client";

import { useMemo, type ReactNode } from "react";
import { CustomerInfo, OrderForm } from "../types";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  previous_due?: number;
  status?: string;
  total_orders?: number;
}

type Props = {
  orderForm: OrderForm;
  setOrderForm: (updater: (prev: OrderForm) => OrderForm) => void;
  customers: Customer[];
  customerType: "existing" | "guest";
  setCustomerType: (type: "existing" | "guest") => void;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (v: boolean) => void;
  highlightText: (text: string, search: string) => ReactNode;
  formatCurrency: (v: number) => string;
};

export default function CustomerSelector({
  orderForm,
  setOrderForm,
  customers,
  customerType,
  setCustomerType,
  selectedCustomerId,
  setSelectedCustomerId,
  customerSearch,
  setCustomerSearch,
  isCustomerDropdownOpen,
  setIsCustomerDropdownOpen,
  highlightText,
  formatCurrency,
}: Props) {
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.phone?.includes(search)
    );
  }, [customers, customerSearch]);

  const handleCustomerSelection = (customerId: number) => {
    setCustomerType("existing");
    setSelectedCustomerId(customerId);
    const selected = customers.find((c) => c.id === customerId);
    if (!selected) return;

    setOrderForm((prev) => ({
      ...prev,
      customer: {
        name: selected.name,
        email: selected.email,
        phone: selected.phone,
        address: selected.address || "",
        company: "",
      },
      previous_due: selected.previous_due || 0,
      apply_previous_due_to_total: true,
    }));
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Customer Selection
      </label>
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search and select customer (minimum 2 characters)..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setIsCustomerDropdownOpen(e.target.value.trim().length >= 2);
              }}
              onFocus={() => {
                if (customerSearch.trim().length >= 2) {
                  setIsCustomerDropdownOpen(true);
                }
              }}
              disabled={customerType === "guest"}
              className={`w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                customerType === "guest" ? "opacity-50 cursor-not-allowed" : "cursor-text"
              }`}
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => {
                  setCustomerSearch("");
                  setSelectedCustomerId(null);
                  setIsCustomerDropdownOpen(false);
                  setOrderForm((prev) => ({
                    ...prev,
                    customer: { name: "", email: "", phone: "", address: "", company: "" },
                    previous_due: 0,
                    apply_previous_due_to_total: true,
                  }));
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-700/50"
                title="Clear search"
              >
                Clear
              </button>
            )}
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isCustomerDropdownOpen && customerSearch.trim().length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.slice(0, 10).map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      handleCustomerSelection(customer.id);
                      setCustomerSearch(`${customer.name}${customer.email ? ` (${customer.email})` : ""}${customer.phone ? ` - ${customer.phone}` : ""}`);
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {highlightText(customer.name, customerSearch.trim())}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {highlightText(customer.email || "No email", customerSearch.trim())} • {highlightText(customer.phone || "No phone", customerSearch.trim())}
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className={`text-xs font-medium ${customer.previous_due && customer.previous_due > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          Due: {formatCurrency(customer.previous_due || 0)}
                        </div>
                        {customer.total_orders && (
                          <div className="text-xs text-slate-500">{customer.total_orders} orders</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-slate-400">No customers found</div>
              )}
              {filteredCustomers.length > 10 && (
                <div className="p-2 text-xs text-slate-500 bg-slate-700/30 border-t border-slate-600/50 text-center">
                  Showing 10 of {filteredCustomers.length} results. Type more to refine search.
                </div>
              )}
            </div>
          )}

          {isCustomerDropdownOpen && (
            <div className="fixed inset-0 z-5" onClick={() => setIsCustomerDropdownOpen(false)} />
          )}
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={customerType === "guest"}
              onChange={(e) => {
                if (e.target.checked) {
                  setCustomerType("guest");
                  setSelectedCustomerId(null);
                  setIsCustomerDropdownOpen(false);
                  setCustomerSearch("");
                  setOrderForm((prev) => ({
                    ...prev,
                    customer: { name: "", email: "", phone: "", address: "", company: "" },
                    previous_due: 0,
                    apply_previous_due_to_total: true,
                  }));
                } else {
                  setCustomerType("existing");
                  setSelectedCustomerId(null);
                  setOrderForm((prev) => ({
                    ...prev,
                    customer: { name: "", email: "", phone: "", address: "", company: "" },
                    previous_due: 0,
                    apply_previous_due_to_total: true,
                  }));
                }
              }}
              className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-300">New Customer</span>
          </label>
        </div>
      </div>
    </div>
  );
}
