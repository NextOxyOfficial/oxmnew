"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast, useConfirm } from "@/components/ui/Feedback";
import { printSheet } from "@/lib/printSheet";

/**
 * Payroll — who has taken how much, and who is drawing ahead of their earnings.
 *
 * Two numbers do the work: what an employee has *earned* (the payslips) and
 * what he has *taken* (the payments). The difference is either money the shop
 * owes him or an advance he has yet to work off, and the table never shows one
 * without the other.
 */

interface PayrollEmployee {
  id: number;
  name: string;
  role: string;
  department: string;
  phone: string;
  status: string;
  monthly_salary: number;
  earned: number;
  paid: number;
  /** Positive → the shop owes. Negative → drawn ahead. */
  outstanding: number;
  advance_taken: number;
  unsettled_advance: number;
  last_paid_on: string | null;
}

interface Summary {
  headcount: number;
  monthly_payroll: number;
  owed_to_staff: number;
  drawn_in_advance: number;
  paid_this_year: number;
}

interface Account {
  id: number;
  name: string;
  balance: string | number;
}

const bn = (value: number) => value.toLocaleString("bn-BD-u-nu-latn");

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("bn-BD-u-nu-latn") : "—";

export default function PayrollPage() {
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState<PayrollEmployee[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Employee id → the amount typed for this run. */
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [kind, setKind] = useState<"salary" | "advance">("salary");
  const [method, setMethod] = useState("cash");
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, accs] = await Promise.all([
        ApiService.getPayroll(),
        ApiService.getBankAccounts(),
      ]);
      setRows(data.employees ?? []);
      setSummary(data.summary ?? null);
      const list = Array.isArray(accs) ? accs : accs?.results ?? [];
      setAccounts(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "তথ্য আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chosen = useMemo(
    () =>
      Object.entries(selected)
        .map(([id, amount]) => ({ id: Number(id), amount: Number(amount) || 0 }))
        .filter((row) => row.amount > 0),
    [selected]
  );
  const chosenTotal = chosen.reduce((sum, row) => sum + row.amount, 0);

  const toggle = (employee: PayrollEmployee) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (employee.id in next) {
        delete next[employee.id];
      } else {
        // Default to what is actually owed, so the common case is one click.
        const owed = employee.outstanding > 0 ? employee.outstanding : 0;
        next[employee.id] = String(Math.round(owed) || "");
      }
      return next;
    });

  const selectAllOwed = () => {
    const next: Record<number, string> = {};
    rows
      .filter((r) => r.outstanding > 0)
      .forEach((r) => {
        next[r.id] = String(Math.round(r.outstanding));
      });
    setSelected(next);
  };

  const pay = async () => {
    if (!chosen.length) {
      toast.error("কাকে কত দেবেন সেটা দিন");
      return;
    }
    const ok = await confirm({
      title: `${bn(chosen.length)} জনকে দেবেন?`,
      message: `সব মিলিয়ে ${formatCurrency(chosenTotal)} যাবে${
        account ? " — ব্যাংকিং-এ খরচ হিসেবেও উঠবে।" : "।"
      }`,
      confirmLabel: "দিয়ে দিন",
    });
    if (!ok) return;

    setPaying(true);
    try {
      await ApiService.paySalaries({
        account: account ? Number(account) : null,
        method,
        note: note.trim() || null,
        payments: chosen.map((row) => ({
          employee: row.id,
          amount: row.amount,
          kind,
        })),
      });
      toast.success(`${bn(chosen.length)} জনকে দেওয়া হয়েছে`);
      setSelected({});
      setNote("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "দেওয়া গেল না");
    } finally {
      setPaying(false);
    }
  };

  const downloadSheet = () => {
    // The sheet the owner actually needs at payday: what is left after every
    // advance already taken.
    printSheet({
      title: "বেতনের বাকির হিসাব",
      subtitle: "অগ্রিম বাদ দিয়ে কার কত পাওনা",
      cards: summary
        ? [
            { label: "মোট কর্মচারী", value: `${bn(summary.headcount)} জন` },
            {
              label: "মাসিক বেতন",
              value: formatCurrency(summary.monthly_payroll),
            },
            {
              label: "এখনো দিতে হবে",
              value: formatCurrency(summary.owed_to_staff),
            },
            {
              label: "অগ্রিম নেওয়া আছে",
              value: formatCurrency(summary.drawn_in_advance),
            },
          ]
        : [],
      head: ["কর্মচারী", "পদ", "মাসিক বেতন", "মোট আয়", "নিয়েছে", "এখনো পাবে"],
      numericColumns: [2, 3, 4, 5],
      rows: rows.map((r) => [
        r.name,
        r.role || "—",
        formatCurrency(r.monthly_salary),
        formatCurrency(r.earned),
        formatCurrency(r.paid),
        r.outstanding >= 0
          ? formatCurrency(r.outstanding)
          : `${formatCurrency(-r.outstanding)} বেশি নিয়েছে`,
      ]),
      footNote: summary
        ? `সব মিলিয়ে ${formatCurrency(
            summary.owed_to_staff
          )} দিতে হবে, আর ${formatCurrency(
            summary.drawn_in_advance
          )} অগ্রিম নেওয়া আছে।`
        : undefined,
    });
  };

  if (loading) {
    return (
      <div className="page space-y-4">
        <div className="plane">
          <div className="plane-section">
            <div className="empty">লোড হচ্ছে…</div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="page-title mt-1">বেতন ম্যানেজমেন্ট</h1>
          <p className="page-sub">
            কে কত নিয়েছে, কে অগ্রিম নিয়ে রেখেছে, আর কার কত বাকি
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadSheet} className="btn btn-ghost">
            <Download className="h-4 w-4" />
            বাকির হিসাব নামান
          </button>
          <button onClick={load} className="btn btn-ghost" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="plane">
          <div className="stat-strip">
            <div className="stat">
              <div className="stat-label">মাসিক বেতন</div>
              <div className="stat-value num">
                {formatCurrency(summary.monthly_payroll)}
              </div>
              <div className="stat-meta">{bn(summary.headcount)} জন কর্মচারী</div>
            </div>
            <div className="stat">
              <div className="stat-label">এখনো দিতে হবে</div>
              <div className="stat-value num money-neg">
                {formatCurrency(summary.owed_to_staff)}
              </div>
              <div className="stat-meta">আয় করেছে কিন্তু পায়নি</div>
            </div>
            <div className="stat">
              <div className="stat-label">অগ্রিম নেওয়া আছে</div>
              <div className="stat-value num text-amber-600">
                {formatCurrency(summary.drawn_in_advance)}
              </div>
              <div className="stat-meta">আয়ের চেয়ে বেশি নিয়ে রেখেছে</div>
            </div>
            <div className="stat">
              <div className="stat-label">এ পর্যন্ত দেওয়া</div>
              <div className="stat-value num">
                {formatCurrency(summary.paid_this_year)}
              </div>
              <div className="stat-meta">সব মিলিয়ে</div>
            </div>
          </div>
        </div>
      )}

      <div className="plane">
        <div className="plane-section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="section-title mb-0">কাকে কত দেবেন</div>
            <button
              type="button"
              onClick={selectAllOwed}
              className="btn btn-ghost btn-sm"
            >
              যাদের বাকি আছে সবাইকে বেছে নিন
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th></th>
                <th>কর্মচারী</th>
                <th className="cell-num">মাসিক বেতন</th>
                <th className="cell-num">মোট আয়</th>
                <th className="cell-num">নিয়েছে</th>
                <th className="cell-num">অবস্থা</th>
                <th>শেষ নিয়েছে</th>
                <th className="cell-num">কত দেবেন</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">কোনো কর্মচারী নেই।</div>
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const picked = row.id in selected;
                return (
                  <tr key={row.id} className={picked ? "row-focus" : ""}>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggle(row)}
                        aria-label={`${row.name} বেছে নিন`}
                        aria-pressed={picked}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                          picked
                            ? "border-cyan-600 bg-cyan-600 text-white"
                            : "border-slate-300 bg-white hover:border-cyan-400"
                        }`}
                      >
                        {picked && <Check className="h-3 w-3" />}
                      </button>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/employees/${row.id}`}
                        className="block cell-strong hover:text-cyan-700"
                      >
                        {row.name}
                      </Link>
                      <span className="block text-xs text-slate-500">
                        {row.role || "পদ নেই"}
                      </span>
                    </td>
                    <td className="cell-num num">
                      {formatCurrency(row.monthly_salary)}
                    </td>
                    <td className="cell-num num">{formatCurrency(row.earned)}</td>
                    <td className="cell-num num">{formatCurrency(row.paid)}</td>
                    <td className="cell-num">
                      {row.outstanding > 0 ? (
                        <span className="num money-neg font-semibold">
                          {formatCurrency(row.outstanding)} পাবে
                        </span>
                      ) : row.outstanding < 0 ? (
                        <span className="num font-semibold text-amber-600">
                          {formatCurrency(-row.outstanding)} বেশি নিয়েছে
                        </span>
                      ) : (
                        <span className="money-pos">হিসাব মিলে গেছে</span>
                      )}
                    </td>
                    <td className="num text-xs text-slate-600">
                      {formatDate(row.last_paid_on)}
                    </td>
                    <td className="cell-num">
                      <input
                        type="number"
                        min={0}
                        value={selected[row.id] ?? ""}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="input input-sm num w-28 text-right"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pinned so the total stays in view while ticking a long staff list. */}
        {chosen.length > 0 && (
          <div className="plane-section sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="label" htmlFor="pay-kind">
                    কী হিসেবে
                  </label>
                  <select
                    id="pay-kind"
                    value={kind}
                    onChange={(e) =>
                      setKind(e.target.value as "salary" | "advance")
                    }
                    className="select select-sm w-auto"
                  >
                    <option value="salary">বেতন</option>
                    <option value="advance">অগ্রিম</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="pay-method">
                    কীভাবে
                  </label>
                  <select
                    id="pay-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="select select-sm w-auto"
                  >
                    <option value="cash">নগদ</option>
                    <option value="bank">ব্যাংক</option>
                    <option value="mobile">মোবাইল ব্যাংকিং</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="pay-account">
                    কোন অ্যাকাউন্ট থেকে
                  </label>
                  <select
                    id="pay-account"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="select select-sm w-auto"
                  >
                    <option value="">ব্যাংকিং-এ তুলবেন না</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="pay-note">
                    নোট
                  </label>
                  <input
                    id="pay-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="আলাদা কিছু লেখার থাকলে"
                    className="input input-sm w-48"
                  />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="text-right">
                  <div className="stat-label">
                    {bn(chosen.length)} জনকে মোট
                  </div>
                  <div className="num text-lg font-semibold text-slate-900">
                    {formatCurrency(chosenTotal)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected({})}
                  className="btn btn-ghost"
                  disabled={paying}
                >
                  <X className="h-4 w-4" />
                  বাদ দিন
                </button>
                <button
                  type="button"
                  onClick={pay}
                  className="btn btn-primary"
                  disabled={paying}
                >
                  <Wallet className="h-4 w-4" />
                  {paying ? "দেওয়া হচ্ছে…" : "দিয়ে দিন"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
