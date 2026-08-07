"use client";

import { useMemo, type ReactNode } from "react";
import { OrderForm } from "../types";

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
    <div>
      <label className="label">কাস্টমার সিলেক্ট করুন</label>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="কাস্টমার খুঁজে সিলেক্ট করুন (অন্তত 2 অক্ষর লিখুন)…"
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
              className="input pr-20"
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
                className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 transition-colors px-1.5 py-1 rounded hover:bg-slate-100"
                title="খোঁজা মুছে দিন"
              >
                মুছুন
              </button>
            )}
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isCustomerDropdownOpen && customerSearch.trim().length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.slice(0, 10).map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      handleCustomerSelection(customer.id);
                      setCustomerSearch(`${customer.name}${customer.email ? ` (${customer.email})` : ""}${customer.phone ? ` - ${customer.phone}` : ""}`);
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-medium truncate">
                          {highlightText(customer.name, customerSearch.trim())}
                        </div>
                        <div className="text-slate-500 text-xs truncate">
                          {highlightText(customer.email || "ইমেইল নেই", customerSearch.trim())} • {highlightText(customer.phone || "ফোন নেই", customerSearch.trim())}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-medium ${customer.previous_due && customer.previous_due > 0 ? "money-neg" : "money-pos"}`}>
                          বাকি: {formatCurrency(customer.previous_due || 0)}
                        </div>
                        {customer.total_orders && (
                          <div className="text-xs text-slate-500">{customer.total_orders}টি অর্ডার</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-500">কোনো কাস্টমার পাওয়া যায়নি</div>
              )}
              {filteredCustomers.length > 10 && (
                <div className="p-2 text-xs text-slate-500 bg-slate-100 border-t border-slate-200 text-center">
                  {filteredCustomers.length}টির মধ্যে 10টি দেখাচ্ছে। আরও লিখে খোঁজ ছোট করুন।
                </div>
              )}
            </div>
          )}

          {isCustomerDropdownOpen && (
            <div className="fixed inset-0 z-5" onClick={() => setIsCustomerDropdownOpen(false)} />
          )}
        </div>

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
            className="w-4 h-4 rounded border-slate-200 text-cyan-600 focus:ring-cyan-500"
          />
          <span className="text-sm text-slate-600">নতুন কাস্টমার</span>
        </label>
      </div>
    </div>
  );
}
