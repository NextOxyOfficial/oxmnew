"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";

export interface MatchableCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  previous_due?: number;
  total_orders?: number;
}

interface Props {
  /** What the user is typing into the new-customer name field. */
  name: string;
  customers: MatchableCustomer[];
  /** Called when the user decides one of these is the same person. */
  onPick: (customer: MatchableCustomer) => void;
  formatCurrency: (value: number | string | null | undefined) => string;
  limit?: number;
}

/**
 * Warns that a "new" customer may already exist.
 *
 * Names in a shop's book repeat constantly ("Rafiq", "Rafiqul Islam"), and a
 * duplicate record splits that person's due across two ledgers. This matches on
 * whole words as well as substrings, so "Islam" surfaces "Rafiqul Islam", and
 * shows enough detail — phone, orders, outstanding due — to tell two people with
 * the same name apart.
 */
export default function CustomerNameMatches({
  name,
  customers,
  onPick,
  formatCurrency,
  limit = 4,
}: Props) {
  const matches = useMemo(() => {
    const query = name.trim().toLowerCase();
    if (query.length < 2) return [];

    const words = query.split(/\s+/).filter((w) => w.length >= 2);

    return customers
      .map((customer) => {
        const candidate = (customer.name || "").toLowerCase();
        if (!candidate) return null;

        // Exact match first, then prefix, then any shared word — so the
        // closest record is the one the user sees at the top.
        let score = 0;
        if (candidate === query) score = 100;
        else if (candidate.startsWith(query)) score = 80;
        else if (candidate.includes(query)) score = 60;
        else if (words.some((word) => candidate.includes(word))) score = 30;

        return score ? { customer, score } : null;
      })
      .filter((row): row is { customer: MatchableCustomer; score: number } => row !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((row) => row.customer);
  }, [name, customers, limit]);

  if (matches.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-amber-800">
        <Users className="h-3.5 w-3.5" />
        এই নামে আগে থেকেই কাস্টমার আছে — একই জন হলে নিচ থেকে সিলেক্ট করুন
      </div>

      <div className="space-y-1">
        {matches.map((customer) => {
          const due = Number(customer.previous_due) || 0;
          return (
            <button
              key={customer.id}
              type="button"
              onClick={() => onPick(customer)}
              className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-md bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-amber-100/60"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {customer.name}
                </span>
                <span className="num block truncate text-xs text-slate-500">
                  {customer.phone || "ফোন নেই"}
                  {customer.email ? ` · ${customer.email}` : ""}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="num block text-xs text-slate-500">
                  {customer.total_orders ?? 0} টা অর্ডার
                </span>
                <span
                  className={`num block text-xs ${due > 0 ? "money-neg" : "text-slate-400"}`}
                >
                  {due > 0 ? `${formatCurrency(due)} বাকি` : "বাকি নেই"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
