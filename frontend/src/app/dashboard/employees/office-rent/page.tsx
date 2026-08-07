"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast, useConfirm } from "@/components/ui/Feedback";
import PagedTable from "@/components/analytics/PagedTable";
import { num } from "@/lib/money";

interface CostPayment {
  id: number;
  period: string;
  amount: string | number;
  paid_on: string;
  receipt_url: string | null;
  notes: string | null;
}

interface RecurringCost {
  id: number;
  account: number | null;
  account_name: string | null;
  title: string;
  category: string;
  amount: string | number;
  due_day: number;
  start_date: string;
  is_active: boolean;
  notes: string | null;
  due_date: string;
  paid_this_month: boolean;
  is_overdue: boolean;
  days_overdue: number;
  paid_total: string | number;
  payments: CostPayment[];
}

const CATEGORIES = [
  { value: "rent", label: "ভাড়া" },
  { value: "utilities", label: "বিদ্যুৎ-গ্যাস-পানি" },
  { value: "internet", label: "ইন্টারনেট / ফোন" },
  { value: "maintenance", label: "মেরামত" },
  { value: "tax", label: "ট্যাক্স / ফি" },
  { value: "other", label: "অন্যান্য" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((row) => [row.value, row.label])
);

const EMPTY = {
  title: "",
  category: "rent",
  amount: "",
  due_day: "1",
  account: "",
  notes: "",
};

/* Dates already render as Bangla numerals via `bn-BD`, so a raw due-day or
   count next to them read as a mismatch (১৫/৮/২০২৬ beside "মাসের 15 তারিখ"). */
const bn = (value: number) => value.toLocaleString("bn-BD");

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("bn-BD") : "—";

const monthName = (value: string) =>
  new Date(value).toLocaleDateString("bn-BD", { month: "long", year: "numeric" });

export default function OfficeRentPage() {
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();
  const confirm = useConfirm();

  const [costs, setCosts] = useState<RecurringCost[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const handleReceipt = async (
    cost: RecurringCost,
    paymentId: number,
    file: File
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ফাইলটা ১০ এমবির বেশি বড় হতে পারবে না");
      return;
    }
    setUploadingId(paymentId);
    try {
      await ApiService.uploadRecurringCostReceipt(cost.id, paymentId, file);
      toast.success("রসিদ যোগ হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "রসিদ আপলোড করা গেল না");
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveReceipt = async (cost: RecurringCost, paymentId: number) => {
    const ok = await confirm({
      title: "রসিদটা মুছে দেবেন?",
      message: "ফাইলটা মুছে যাবে, মাসের রেকর্ড থেকে যাবে।",
      confirmLabel: "মুছে দিন",
      danger: true,
    });
    if (!ok) return;
    setUploadingId(paymentId);
    try {
      await ApiService.deleteRecurringCostReceipt(cost.id, paymentId);
      toast.success("রসিদ মুছে দেওয়া হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "মুছে দেওয়া গেল না");
    } finally {
      setUploadingId(null);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getRecurringCosts();
      setCosts(Array.isArray(data) ? data : data?.results ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "তথ্য আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    ApiService.getBankAccounts()
      .then((res: unknown) => {
        const rows = Array.isArray(res)
          ? res
          : (res as { results?: { id: number; name: string }[] })?.results ?? [];
        setAccounts(rows as { id: number; name: string }[]);
      })
      .catch(() => setAccounts([]));
  }, [load]);

  const active = costs.filter((cost) => cost.is_active);
  const monthlyTotal = active.reduce((sum, cost) => sum + num(cost.amount), 0);
  const unpaid = active.filter((cost) => !cost.paid_this_month);
  const unpaidTotal = unpaid.reduce((sum, cost) => sum + num(cost.amount), 0);
  const paid = active.filter((cost) => cost.paid_this_month);
  const paidTotal = monthlyTotal - unpaidTotal;
  const overdue = unpaid.filter((cost) => cost.is_overdue).length;

  const setField = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) return setFormError("খরচটার নাম লিখুন");
    if (num(form.amount) <= 0) return setFormError("মাসিক টাকার অঙ্ক দিন");

    setSaving(true);
    try {
      await ApiService.createRecurringCost({
        title: form.title.trim(),
        category: form.category,
        amount: form.amount,
        due_day: Number(form.due_day) || 1,
        account: form.account ? Number(form.account) : null,
        notes: form.notes.trim() || null,
      });
      toast.success("খরচটা যোগ হয়েছে");
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "যোগ করা গেল না");
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (cost: RecurringCost) => {
    const ok = await confirm({
      title: "এই মাসের টাকা দেবেন?",
      message: `${cost.title} — ${formatCurrency(
        num(cost.amount)
      )} টাকা জমা হবে, আর ব্যাংকিং-এ খরচ হিসেবেও উঠবে।`,
      confirmLabel: "জমা দিন",
    });
    if (!ok) return;

    setBusyId(cost.id);
    try {
      await ApiService.payRecurringCost(cost.id);
      toast.success("টাকা জমা হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "জমা দেওয়া গেল না");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemovePayment = async (cost: RecurringCost, paymentId: number) => {
    const ok = await confirm({
      title: "এই মাসের রেকর্ড বাতিল করবেন?",
      message: "ব্যাংকিং থেকে খরচটাও সরে যাবে আর ব্যালেন্স ফেরত আসবে।",
      confirmLabel: "বাতিল করুন",
      danger: true,
    });
    if (!ok) return;
    try {
      await ApiService.removeRecurringCostPayment(cost.id, paymentId);
      toast.success("বাতিল হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "বাতিল করা গেল না");
    }
  };

  const handleDelete = async (cost: RecurringCost) => {
    const ok = await confirm({
      title: "খরচটা মুছে দেবেন?",
      message: "আগের মাসগুলোর রেকর্ডসহ মুছে যাবে।",
      confirmLabel: "মুছে দিন",
      danger: true,
    });
    if (!ok) return;
    try {
      await ApiService.deleteRecurringCost(cost.id);
      toast.success("মুছে দেওয়া হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "মুছে দেওয়া গেল না");
    }
  };

  return (
    <div className="page space-y-4">
      <div className="page-head">
        <div>
          <Link
            href="/dashboard/employees"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            কর্মচারী
          </Link>
          <h1 className="page-title mt-1">অফিস ম্যানেজমেন্ট</h1>
          <p className="page-sub">
            ভাড়া, বিল, ইন্টারনেট — প্রতি মাসে যা দিতেই হয়। বেতনের মতোই দিনের
            টার্গেটে ধরা হয়।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-ghost" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            নতুন খরচ
          </button>
        </div>
      </div>

      <div className="plane">
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মাসে মোট</div>
            <div className="stat-value num money-neg">
              {formatCurrency(monthlyTotal)}
            </div>
            <div className="stat-meta">{bn(active.length)} টা নির্দিষ্ট খরচ</div>
          </div>
          {/* Four figures, not three — the strip is a four-column grid, so a
              third stat leaves a visible hole on the right. */}
          <div className="stat">
            <div className="stat-label">এই মাসে দেওয়া হয়েছে</div>
            <div className="stat-value num money-pos">
              {formatCurrency(paidTotal)}
            </div>
            <div className="stat-meta">
              {active.length > 0
                ? `${bn(active.length)} টার মধ্যে ${bn(paid.length)} টা`
                : "এখনো কিছু যোগ করা হয়নি"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">এই মাসে বাকি</div>
            <div
              className={`stat-value num ${
                unpaidTotal > 0 ? "money-neg" : "money-pos"
              }`}
            >
              {formatCurrency(unpaidTotal)}
            </div>
            <div className="stat-meta">
              {unpaid.length === 0
                ? "সব দেওয়া হয়েছে"
                : overdue > 0
                ? `${bn(unpaid.length)} টা বাকি · ${bn(overdue)} টার সময় পেরিয়ে গেছে`
                : `${bn(unpaid.length)} টা দেওয়া হয়নি`}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">দিনে গড়ে</div>
            <div className="stat-value num">
              {formatCurrency(monthlyTotal / 30)}
            </div>
            <div className="stat-meta">টার্গেটে এটাই ধরা হয়</div>
          </div>
        </div>

        {error ? (
          <div className="plane-section">
            <div className="empty">
              <p>{error}</p>
              <button onClick={load} className="btn btn-ghost btn-sm mt-2">
                আবার চেষ্টা করুন
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="plane-section">
            <div className="empty">লোড হচ্ছে…</div>
          </div>
        ) : costs.length === 0 ? (
          <div className="plane-section">
            <div className="empty">
              <p>এখনো কোনো নির্দিষ্ট খরচ যোগ করা হয়নি।</p>
              <p className="mt-1 text-xs text-slate-500">
                অফিস ভাড়া, ইন্টারনেট বিল — যেগুলো প্রতি মাসে দিতেই হয়, সেগুলো
                এখানে রাখলে অ্যানালিটিক্স ঠিক হিসাব দেবে।
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary btn-sm mt-3"
              >
                <Plus className="h-3.5 w-3.5" />
                প্রথমটা যোগ করুন
              </button>
            </div>
          </div>
        ) : (
          /* One aligned table instead of a full-width band per cost: with the
             plane ~960px wide, band layout pushed the title to the far left and
             the amount to the far right with nothing between them. */
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>খরচ</th>
                  <th>খাত</th>
                  <th className="cell-num">মাসে কত</th>
                  <th>কবের মধ্যে</th>
                  <th>অবস্থা</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <Fragment key={cost.id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenId(openId === cost.id ? null : cost.id)
                          }
                          aria-expanded={openId === cost.id}
                          className="flex items-center gap-1.5 text-left"
                        >
                          <ChevronRight
                            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                              openId === cost.id ? "rotate-90" : ""
                            }`}
                          />
                          <span className="min-w-0">
                            <span className="block cell-strong hover:text-cyan-700">
                              {cost.title}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {bn(cost.payments.length)} মাস দেওয়া হয়েছে
                              {cost.account_name ? ` · ${cost.account_name}` : ""}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="text-slate-600">
                        {CATEGORY_LABELS[cost.category] ?? cost.category}
                      </td>
                      <td className="cell-num num font-semibold money-neg">
                        {formatCurrency(num(cost.amount))}
                      </td>
                      <td className="num text-xs text-slate-600">
                        মাসের {bn(cost.due_day)} তারিখ
                      </td>
                      <td>
                        <span
                          className={
                            cost.paid_this_month
                              ? "badge badge-success"
                              : cost.is_overdue
                              ? "badge badge-danger"
                              : "badge badge-warn"
                          }
                        >
                          {cost.paid_this_month
                            ? "দেওয়া হয়েছে"
                            : cost.is_overdue
                            ? `${bn(cost.days_overdue)} দিন দেরি`
                            : `${formatDate(cost.due_date)} এর মধ্যে`}
                        </span>
                      </td>
                      <td className="cell-num">
                        <div className="row-actions">
                          {!cost.paid_this_month && (
                            <button
                              onClick={() => handlePay(cost)}
                              disabled={busyId === cost.id}
                              className="btn btn-primary btn-sm whitespace-nowrap"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              {busyId === cost.id ? "জমা হচ্ছে…" : "এই মাসের দিন"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(cost)}
                            aria-label={`${cost.title} মুছে দিন`}
                            className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {openId === cost.id && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50/60">
                          <div className="section-title">
                            কোন কোন মাস দেওয়া হয়েছে
                          </div>
                          <PagedTable
                    rows={cost.payments}
                    pageSize={6}
                    empty="এখনো কোনো মাসের টাকা দেওয়া হয়নি।"
                    head={
                      <tr>
                        <th>মাস</th>
                        <th className="cell-num">টাকা</th>
                        <th>কবে দেওয়া হয়েছে</th>
                        <th>রসিদ</th>
                        <th></th>
                      </tr>
                    }
                    renderRow={(payment) => (
                      <tr key={payment.id}>
                        <td className="cell-strong">{monthName(payment.period)}</td>
                        <td className="cell-num num">
                          {formatCurrency(num(payment.amount))}
                        </td>
                        <td className="num text-xs">{formatDate(payment.paid_on)}</td>
                        <td>
                          {/* Proof of payment lives with the month it settles,
                              so a landlord dispute has an answer on the spot. */}
                          {payment.receipt_url ? (
                            <span className="flex items-center gap-1">
                              <a
                                href={payment.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                দেখুন
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveReceipt(cost, payment.id)
                                }
                                disabled={uploadingId === payment.id}
                                aria-label="রসিদ মুছে দিন"
                                title="রসিদটা মুছে দিন"
                                className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ) : (
                            <label className="btn btn-ghost btn-sm cursor-pointer">
                              <Upload className="h-3.5 w-3.5" />
                              {uploadingId === payment.id ? "যাচ্ছে…" : "রসিদ দিন"}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (file) handleReceipt(cost, payment.id, file);
                                }}
                              />
                            </label>
                          )}
                        </td>
                        <td className="cell-num">
                          <button
                            onClick={() => handleRemovePayment(cost, payment.id)}
                            aria-label="এই মাসের রেকর্ড বাতিল করুন"
                            title="ভুল করে দিলে বাতিল করুন"
                            className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                            )}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">নতুন নির্দিষ্ট খরচ</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="বন্ধ করুন"
                className="btn btn-ghost btn-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                {formError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {formError}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">কী খরচ *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="input"
                      placeholder="যেমন: অফিস ভাড়া"
                    />
                  </div>
                  <div>
                    <label className="label">মাসে কত *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setField("amount", e.target.value)}
                      className="input num"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">মাসের কত তারিখে</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.due_day}
                      onChange={(e) => setField("due_day", e.target.value)}
                      className="input num"
                    />
                  </div>
                  <div>
                    <label className="label">কোন খাতে</label>
                    <select
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      className="select"
                    >
                      {CATEGORIES.map((row) => (
                        <option key={row.value} value={row.value}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">কোন অ্যাকাউন্ট থেকে</label>
                    <select
                      value={form.account}
                      onChange={(e) => setField("account", e.target.value)}
                      className="select"
                    >
                      <option value="">অ্যাকাউন্ট সিলেক্ট করুন</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">নোট</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    className="input min-h-20"
                    placeholder="আলাদা কিছু মনে রাখার থাকলে"
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-ghost"
                  disabled={saving}
                >
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "সেভ হচ্ছে…" : "যোগ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
