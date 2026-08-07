"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/Feedback";
import { PAYMENT_METHODS, Vehicle, toNumber } from "@/lib/vehicles";

interface CustomerOption {
  id: number;
  name: string;
  phone?: string | null;
}

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
  onSold: (vehicle: Vehicle) => void;
}

/**
 * Turns an in-stock unit into a sale.
 *
 * The backend creates a regular Order behind this, so the sale lands in the
 * normal বিক্রি list and its payments live on that order — there is deliberately
 * no separate vehicle invoice.
 */
export default function SellVehicleModal({ vehicle, onClose, onSold }: Props) {
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [sellPrice, setSellPrice] = useState(String(vehicle.sell_price ?? ""));
  const [paidAmount, setPaidAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ApiService.getCustomers({ page_size: 200 });
        setCustomers(
          Array.isArray(response) ? response : response?.results ?? []
        );
      } catch {
        toast.error("কাস্টমারের লিস্ট আনা যায়নি");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const price = toNumber(sellPrice);
  const paid = toNumber(paidAmount);
  const due = Math.max(0, price - paid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("কোন কাস্টমার কিনছেন সেটা সিলেক্ট করুন");
      return;
    }
    if (price <= 0) {
      setError("বিক্রির দাম দিন");
      return;
    }
    if (paid > price) {
      setError("জমা টাকা বিক্রির দামের চেয়ে বেশি হতে পারে না");
      return;
    }

    setSaving(true);
    try {
      const result = await ApiService.sellVehicle(vehicle.id, {
        customer: Number(customerId),
        sell_price: price,
        paid_amount: paid,
        payment_method: method,
        payment_reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`বিক্রি হয়ে গেছে — ইনভয়েস ${result.order_number}`);
      onSold(result.vehicle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "বিক্রি করা গেল না");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-head">
          <h2 className="modal-title">বাইক বিক্রি করুন</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="btn btn-ghost btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="font-medium text-slate-900">{vehicle.product_name}</div>
              <div className="text-xs text-slate-500">
                চেসিস {vehicle.chassis_number} · ইঞ্জিন {vehicle.engine_number}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="label">কাস্টমার *</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="input mb-2"
                placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন"
              />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="select"
                size={1}
              >
                <option value="">কাস্টমার সিলেক্ট করুন</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </select>
              {customerSearch && filteredCustomers.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  এই নামে কোনো কাস্টমার পাওয়া যায়নি।
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">বিক্রির দাম *</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="input num"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">এখন কত টাকা জমা</label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="input num"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">টাকা দেওয়ার মাধ্যম</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="select"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">রেফারেন্স</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="input"
                  placeholder="ট্রানজেকশন আইডি / চেক নম্বর"
                />
              </div>
            </div>

            <div>
              <label className="label">নোট</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-20"
                placeholder="বিক্রি নিয়ে আলাদা কিছু লেখার থাকলে"
              />
            </div>

            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">সর্বমোট</span>
                <span className="num font-semibold">{formatCurrency(price)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600">জমা</span>
                <span className="num money-pos">{formatCurrency(paid)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-600">বাকি থাকবে</span>
                <span className={`num font-semibold ${due > 0 ? "money-neg" : "money-pos"}`}>
                  {formatCurrency(due)}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={saving}
            >
              বাতিল
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "বিক্রি হচ্ছে…" : "বিক্রি করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
