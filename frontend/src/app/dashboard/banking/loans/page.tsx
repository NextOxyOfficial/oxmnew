"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
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
import Pagination from "@/components/ui/Pagination";
import PagedTable from "@/components/analytics/PagedTable";
import {
  INSTALLMENT_STATE,
  countdownText,
  Loan,
  LoanInstallment,
  LoanSummary,
  LOAN_STATUSES,
  formatDate,
  loanStateText,
  bn,
  loanStatusBadge,
  nextDueAnchor,
  nextDueDays,
  toNumber,
} from "@/lib/loans";

const EMPTY_FORM = {
  lender: "",
  purpose: "",
  principal: "",
  total_payable: "",
  interest_rate: "",
  installment_amount: "",
  installment_count: "",
  payment_day: "1",
  start_date: "",
  account: "",
  notes: "",
};

/**
 * What still has to be paid comes first.
 *
 * Strict serial order buried the next due installment under every settled one,
 * which is the opposite of useful on a 24-month loan. Overdue leads, then
 * upcoming, then the paid ones as history — and the installment number is on
 * every row so the sequence stays readable.
 *
 * The paid group runs newest-first: on the first page the useful history is the
 * কিস্তি just settled, not the one paid a year ago.
 */
const STATE_RANK: Record<string, number> = { overdue: 0, upcoming: 1, paid: 2 };

const orderedSchedule = (rows: LoanInstallment[]) =>
  [...rows].sort(
    (a, b) =>
      (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9) ||
      (a.state === "paid" ? b.number - a.number : a.number - b.number)
  );

export default function LoansPage() {
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();
  const confirm = useConfirm();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  // Which loan has its month-by-month plan open.
  const [collapsedIds, setCollapsedIds] = useState<number[]>([]);
  const isOpen = (id: number) => !collapsedIds.includes(id);
  const toggleSchedule = (id: number) =>
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [loanData, summaryData] = await Promise.all([
        ApiService.getLoans({ page_size: 500 }),
        ApiService.getLoanSummary(),
      ]);
      setLoans(Array.isArray(loanData) ? loanData : loanData?.results ?? []);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "লোনের তথ্য আনা যায়নি");
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

  useEffect(() => {
    setPage(1);
  }, [statusFilter, perPage]);

  const filtered = useMemo(
    () => (statusFilter ? loans.filter((l) => l.status === statusFilter) : loans),
    [loans, statusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.lender.trim()) return setFormError("কার কাছ থেকে লোন নিয়েছেন লিখুন");
    if (toNumber(form.principal) <= 0) return setFormError("মূল টাকার অঙ্ক দিন");
    if (toNumber(form.total_payable) < toNumber(form.principal))
      return setFormError("মোট ফেরত মূল টাকার চেয়ে কম হতে পারে না");
    if (toNumber(form.installment_amount) <= 0)
      return setFormError("মাসিক কিস্তির অঙ্ক দিন");
    if (Number(form.installment_count) <= 0)
      return setFormError("কত মাসে শোধ হবে সেটা দিন");
    if (!form.start_date) return setFormError("শুরুর তারিখ দিন");

    setSaving(true);
    try {
      await ApiService.createLoan({
        lender: form.lender.trim(),
        purpose: form.purpose.trim(),
        principal: form.principal,
        total_payable: form.total_payable,
        interest_rate: form.interest_rate || 0,
        installment_amount: form.installment_amount,
        installment_count: Number(form.installment_count),
        payment_day: Number(form.payment_day) || 1,
        start_date: form.start_date,
        account: form.account ? Number(form.account) : null,
        notes: form.notes.trim() || null,
      });
      toast.success("লোন যোগ হয়েছে");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "লোন যোগ করা গেল না");
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (loan: Loan) => {
    const ok = await confirm({
      title: "কিস্তি জমা দেবেন?",
      message: `${loan.lender} — ${formatCurrency(
        toNumber(loan.installment_amount)
      )} টাকা জমা হবে, আর ব্যাংকিং-এ খরচ হিসেবেও উঠবে।`,
      confirmLabel: "জমা দিন",
    });
    if (!ok) return;

    setPayingId(loan.id);
    try {
      await ApiService.payLoanInstallment(loan.id);
      toast.success("কিস্তি পরিশোধ হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "জমা দেওয়া গেল না");
    } finally {
      setPayingId(null);
    }
  };

  const handleReceipt = async (loan: Loan, paymentId: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ফাইলটা ১০ এমবির বেশি বড় হতে পারবে না");
      return;
    }
    setUploadingId(paymentId);
    try {
      await ApiService.uploadLoanInstallmentReceipt(loan.id, paymentId, file);
      toast.success("রসিদ যোগ হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "রসিদ আপলোড করা গেল না");
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveReceipt = async (loan: Loan, paymentId: number) => {
    const ok = await confirm({
      title: "রসিদটা মুছে দেবেন?",
      message: "ফাইলটা মুছে যাবে, কিস্তির রেকর্ড থেকে যাবে।",
      confirmLabel: "মুছে দিন",
      danger: true,
    });
    if (!ok) return;
    setUploadingId(paymentId);
    try {
      await ApiService.deleteLoanInstallmentReceipt(loan.id, paymentId);
      toast.success("রসিদ মুছে দেওয়া হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "মুছে দেওয়া গেল না");
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveInstallment = async (loan: Loan, paymentId: number) => {
    const ok = await confirm({
      title: "কিস্তিটা বাতিল করবেন?",
      message:
        "ভুল করে জমা দিলে এটা বাতিল করুন। ব্যাংকিং থেকে খরচটাও সরে যাবে আর ব্যালেন্স ফেরত আসবে।",
      confirmLabel: "বাতিল করুন",
      danger: true,
    });
    if (!ok) return;

    setRemovingId(paymentId);
    try {
      await ApiService.removeLoanInstallment(loan.id, paymentId);
      toast.success("কিস্তিটা বাতিল হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "বাতিল করা গেল না");
    } finally {
      setRemovingId(null);
    }
  };

  const handleDelete = async (loan: Loan) => {
    const ok = await confirm({
      title: "লোনটা মুছে দেবেন?",
      message: "কিস্তির হিস্ট্রিসহ মুছে যাবে, আর ফেরানো যাবে না।",
      confirmLabel: "মুছে দিন",
      danger: true,
    });
    if (!ok) return;
    try {
      await ApiService.deleteLoan(loan.id);
      toast.success("লোনটা মুছে দেওয়া হয়েছে");
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
            href="/dashboard/banking"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            ব্যাংকিং
          </Link>
          <h1 className="page-title mt-1">লোন ও কিস্তি</h1>
          <p className="page-sub">
            মাসিক কিস্তি দিনের টার্গেটেও ধরা হয়, তাই হিসাব মিলিয়ে চলে
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-ghost" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            নতুন লোন
          </button>
        </div>
      </div>

      <div className="plane">
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">চলমান লোন</div>
            <div className="stat-value num">{summary?.active_count ?? "—"}</div>
          </div>
          <div className="stat">
            <div className="stat-label">মাসিক কিস্তি</div>
            <div className="stat-value num money-neg">
              {summary ? formatCurrency(toNumber(summary.monthly_due)) : "—"}
            </div>
            <div className="stat-meta">প্রতি মাসে দিতেই হবে</div>
          </div>
          <div className="stat">
            <div className="stat-label">এখনো বাকি</div>
            <div className="stat-value num money-neg">
              {summary ? formatCurrency(toNumber(summary.outstanding)) : "—"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">দেরি হয়েছে</div>
            <div
              className={`stat-value num ${
                (summary?.overdue_count ?? 0) > 0 ? "money-neg" : "money-pos"
              }`}
            >
              {summary?.overdue_count ?? "—"}
            </div>
            <div className="stat-meta">
              {summary?.next_due
                ? `পরের তারিখ ${formatDate(summary.next_due)}`
                : "কোনো তারিখ নেই"}
            </div>
          </div>
        </div>

        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {[{ value: "active", label: "চলছে" }, ...LOAN_STATUSES.slice(1), { value: "", label: "সব" }].map(
              (tab) => (
                <button
                  key={tab.value || "all"}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`btn btn-sm ${
                    statusFilter === tab.value ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {tab.label}
                  <span className="num opacity-70">
                    ({tab.value ? loans.filter((l) => l.status === tab.value).length : loans.length})
                  </span>
                </button>
              )
            )}
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
            <div className="empty">লোনের তথ্য লোড হচ্ছে…</div>
          </div>
        ) : visible.length === 0 ? (
          <div className="plane-section">
            <div className="empty">
              <p>এই অবস্থায় কোনো লোন নেই।</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary btn-sm mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                লোন যোগ করুন
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>কার কাছে</th>
                    <th className="cell-num">মাসিক কিস্তি</th>
                    <th className="cell-num">এখনো বাকি</th>
                    <th>কতটা শোধ</th>
                    <th>পরের তারিখ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleSchedule(loan.id)}
                          aria-expanded={isOpen(loan.id)}
                          className="flex items-start gap-1.5 text-left"
                        >
                          {isOpen(loan.id) ? (
                            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          ) : (
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span>
                            <span className="block cell-strong hover:text-cyan-700">
                              {loan.lender}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {loan.purpose || "—"}
                              {loan.account_name ? ` · ${loan.account_name}` : ""}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="cell-num num money-neg">
                        {formatCurrency(toNumber(loan.installment_amount))}
                      </td>
                      <td className="cell-num num">
                        {formatCurrency(toNumber(loan.remaining_amount))}
                      </td>
                      <td>
                        <div className="num text-xs text-slate-700">
                          {bn(loan.paid_count)}/{bn(loan.installment_count)} কিস্তি
                        </div>
                        {/* A bar, not a chart — it reads at a glance and the
                            exact figures sit beside it. */}
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-cyan-600"
                            style={{ width: `${Math.min(100, loan.progress_pct)}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="num text-xs">
                          {formatDate(loan.next_due_date)}
                        </div>
                        <span className={loanStatusBadge(loan)}>
                          {loanStateText(loan)}
                        </span>
                      </td>
                      <td className="cell-num">
                        <div className="row-actions">
                          <button
                            onClick={() => handleDelete(loan)}
                            aria-label="লোনটা মুছে দিন"
                            className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )).flatMap((row, index) => {
                    const loan = visible[index];
                    if (!isOpen(loan.id) || !loan.schedule?.length) {
                      return [row];
                    }
                    return [
                      row,
                      <tr key={`${loan.id}-schedule`}>
                        <td colSpan={6} className="bg-slate-50/70">
                          <div className="px-1 py-2">
                            {/* Pinned so the date you owe stays visible while
                                scrolling a twenty-four month plan. */}
                            <div className="sticky top-0 z-10 -mx-1 mb-2 flex flex-wrap items-center justify-between gap-2 bg-slate-50/95 px-1 py-2 backdrop-blur">
                              <span className="section-title mb-0">
                                কিস্তির তালিকা ({bn(loan.paid_count)}/
                                {bn(loan.installment_count)} পরিশোধ হয়েছে)
                              </span>
                              {loan.next_due_date && (
                                <span
                                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                    loan.is_overdue
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-cyan-200 bg-cyan-50 text-cyan-800"
                                  }`}
                                >
                                  পরের কিস্তি {formatDate(loan.next_due_date)}
                                  {loan.is_overdue
                                    ? ` · ${countdownText(-loan.days_overdue)}`
                                    : ` · ${countdownText(
                                        nextDueDays(loan),
                                        nextDueAnchor(loan),
                                        loan.next_due_date
                                      )}`}
                                </span>
                              )}
                            </div>
                            <PagedTable
                              rows={orderedSchedule(loan.schedule)}
                              pageSize={6}
                              head={
                                <tr>
                                  <th>কিস্তি</th>
                                  <th>কবে দিতে হবে</th>
                                  <th className="cell-num">টাকা</th>
                                  <th>অবস্থা</th>
                                  <th>কবে দেওয়া হয়েছে</th>
                                  <th>রসিদ</th>
                                  <th></th>
                                </tr>
                              }
                              renderRow={(item) => {
                                // The one that has to be paid next. Sorting
                                // already floats it to the top, but on a long
                                // plan every row looks alike — this is the row
                                // the eye should land on.
                                const isNext =
                                  item.state !== "paid" &&
                                  item.number === loan.paid_count + 1;
                                return (
                                <tr
                                  key={item.number}
                                  className={isNext ? "row-focus" : ""}
                                >
                                  <td className="cell-strong num">
                                    {item.number} নম্বর
                                    {isNext && (
                                      <span className="ml-1.5 rounded bg-cyan-600 px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                                        পরের কিস্তি
                                      </span>
                                    )}
                                  </td>
                                  <td className="num">{formatDate(item.due_date)}</td>
                                  <td className="cell-num num">
                                    {formatCurrency(toNumber(item.amount))}
                                  </td>
                                  <td>
                                    <span
                                      className={INSTALLMENT_STATE[item.state].badge}
                                    >
                                      {INSTALLMENT_STATE[item.state].label}
                                    </span>
                                    {item.state !== "paid" && (
                                      <div
                                        className={`mt-0.5 text-xs ${
                                          item.state === "overdue"
                                            ? "money-neg"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {countdownText(
                                          item.days_until,
                                          item.countdown_from,
                                          item.due_date
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="num text-xs">
                                    {item.paid_on ? (
                                      <>
                                        {formatDate(item.paid_on)}
                                        {item.days_late > 0 && (
                                          <span className="money-neg">
                                            {" "}
                                            ({bn(item.days_late)} দিন দেরিতে)
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td>
                                    {/* Proof of payment sits with the
                                        installment it settles, so a dispute
                                        with the lender has an answer on the
                                        spot. */}
                                    {item.state !== "paid" || !item.payment_id ? (
                                      "—"
                                    ) : item.receipt_url ? (
                                      <span className="flex items-center gap-1">
                                        <a
                                          href={item.receipt_url}
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
                                            handleRemoveReceipt(
                                              loan,
                                              item.payment_id as number
                                            )
                                          }
                                          disabled={uploadingId === item.payment_id}
                                          aria-label={`${item.number} নম্বর কিস্তির রসিদ মুছে দিন`}
                                          title="রসিদটা মুছে দিন"
                                          className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </span>
                                    ) : (
                                      <label className="btn btn-ghost btn-sm cursor-pointer">
                                        <Upload className="h-3.5 w-3.5" />
                                        {uploadingId === item.payment_id
                                          ? "যাচ্ছে…"
                                          : "রসিদ দিন"}
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="sr-only"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = "";
                                            if (file)
                                              handleReceipt(
                                                loan,
                                                item.payment_id as number,
                                                file
                                              );
                                          }}
                                        />
                                      </label>
                                    )}
                                  </td>
                                  <td className="cell-num">
                                    {/* Pay right here rather than from the row
                                        above, so it is obvious which
                                        installment is being settled. */}
                                    {item.state !== "paid" &&
                                      item.number === loan.paid_count + 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handlePay(loan)}
                                          disabled={payingId === loan.id}
                                          className="btn btn-primary btn-sm"
                                        >
                                          <Wallet className="h-3.5 w-3.5" />
                                          {payingId === loan.id
                                            ? "জমা হচ্ছে…"
                                            : "কিস্তি জমা"}
                                        </button>
                                      )}
                                    {item.state === "paid" && item.payment_id && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveInstallment(
                                            loan,
                                            item.payment_id as number
                                          )
                                        }
                                        disabled={removingId === item.payment_id}
                                        aria-label={`${item.number} নম্বর কিস্তি বাতিল করুন`}
                                        title="ভুল করে জমা দিলে বাতিল করুন"
                                        className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                                );
                              }}
                            />
                          </div>
                        </td>
                      </tr>,
                    ];
                  })}
                </tbody>
              </table>
            </div>

            <div className="plane-section">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
                onPageSizeChange={setPerPage}
              />
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">নতুন লোন</h2>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">কার কাছ থেকে *</label>
                    <input
                      type="text"
                      value={form.lender}
                      onChange={(e) => setField("lender", e.target.value)}
                      className="input"
                      placeholder="যেমন: ব্র্যাক ব্যাংক"
                    />
                  </div>
                  <div>
                    <label className="label">কী জন্য</label>
                    <input
                      type="text"
                      value={form.purpose}
                      onChange={(e) => setField("purpose", e.target.value)}
                      className="input"
                      placeholder="যেমন: দোকান সম্প্রসারণ"
                    />
                  </div>
                  <div>
                    <label className="label">মূল টাকা *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.principal}
                      onChange={(e) => setField("principal", e.target.value)}
                      className="input num"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">মোট ফেরত দিতে হবে *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.total_payable}
                      onChange={(e) => setField("total_payable", e.target.value)}
                      className="input num"
                      placeholder="সুদসহ"
                    />
                  </div>
                  <div>
                    <label className="label">মাসিক কিস্তি *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.installment_amount}
                      onChange={(e) =>
                        setField("installment_amount", e.target.value)
                      }
                      className="input num"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">কত মাসে শোধ *</label>
                    <input
                      type="number"
                      value={form.installment_count}
                      onChange={(e) =>
                        setField("installment_count", e.target.value)
                      }
                      className="input num"
                      placeholder="যেমন: 24"
                    />
                  </div>
                  <div>
                    <label className="label">মাসের কত তারিখে</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.payment_day}
                      onChange={(e) => setField("payment_day", e.target.value)}
                      className="input num"
                    />
                  </div>
                  <div>
                    <label className="label">শুরুর তারিখ *</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setField("start_date", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">সুদের হার (বছরে %)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.interest_rate}
                      onChange={(e) => setField("interest_rate", e.target.value)}
                      className="input num"
                      placeholder="0"
                    />
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
                    <p className="mt-1 text-xs text-slate-500">
                      দিলে কিস্তি জমা দিলে ব্যাংকিং-এ খরচও উঠবে
                    </p>
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
                  {saving ? "সেভ হচ্ছে…" : "লোন যোগ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
