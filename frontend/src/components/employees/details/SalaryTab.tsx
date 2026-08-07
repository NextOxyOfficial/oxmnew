"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { SalaryRecord, CreateSalaryRecordData } from "@/types/employee";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";

interface SalaryTabProps {
  salaryRecords: SalaryRecord[];
  employeeId: string;
  onSalaryRecordsUpdate: (records: SalaryRecord[]) => void;
}

// Display-only labels; the underlying option values stay English.
const MONTH_LABELS: Record<string, string> = {
  January: "জানুয়ারি",
  February: "ফেব্রুয়ারি",
  March: "মার্চ",
  April: "এপ্রিল",
  May: "মে",
  June: "জুন",
  July: "জুলাই",
  August: "আগস্ট",
  September: "সেপ্টেম্বর",
  October: "অক্টোবর",
  November: "নভেম্বর",
  December: "ডিসেম্বর",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "শেষ",
  paid: "পরিশোধ",
  approved: "অনুমোদিত",
  in_progress: "চলছে",
  processing: "প্রসেস হচ্ছে",
  pending: "বাকি আছে",
  cancelled: "বাতিল করা",
};

/**
 * One payment actually handed over — an advance mid-month or the balance after
 * payday. Separate from the payslip above it, because a payslip says what was
 * *earned* and this says what was *taken*.
 */
interface PayrollPayment {
  id: number;
  amount: number;
  kind: "advance" | "salary";
  method: string;
  paid_on: string;
  note: string | null;
  period: string | null;
}

interface PayrollLedger {
  earned: number;
  paid: number;
  outstanding: number;
  unsettled_advance: number;
}

const KIND_LABEL: Record<string, string> = {
  advance: "অগ্রিম",
  salary: "বেতন",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "নগদ",
  bank: "ব্যাংক",
  mobile: "মোবাইল ব্যাংকিং",
};

export default function SalaryTab({ salaryRecords, employeeId, onSalaryRecordsUpdate }: SalaryTabProps) {
  const formatCurrencyWithSymbol = useCurrencyFormatter();
  const [payments, setPayments] = useState<PayrollPayment[]>([]);
  const [ledger, setLedger] = useState<PayrollLedger | null>(null);

  // The advances live in payroll, not in the salary records this tab was given,
  // so they are fetched here rather than threaded through the parent page.
  const loadPayroll = useCallback(async () => {
    if (!employeeId) return;
    try {
      const data = await ApiService.getEmployeePayroll(Number(employeeId));
      setPayments(data.payments ?? []);
      setLedger(data.employee ?? null);
    } catch {
      // A payroll outage must not blank out the payslip table above.
      setPayments([]);
      setLedger(null);
    }
  }, [employeeId]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const removePayment = async (paymentId: number) => {
    try {
      await ApiService.removeSalaryPayment(paymentId);
      await loadPayroll();
    } catch {
      /* The list simply stays as it was. */
    }
  };
  const [mounted, setMounted] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showSalaryDeleteModal, setShowSalaryDeleteModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<number | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isDeletingSalary, setIsDeletingSalary] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    base_salary: "",
    overtime_hours: "",
    overtime_rate: "",
    bonuses: "",
    deductions: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
      case "approved":
        return "badge badge-success";
      case "in_progress":
      case "processing":
        return "badge badge-info";
      case "pending":
        return "badge badge-warn";
      case "cancelled":
        return "badge badge-danger";
      default:
        return "badge badge-muted";
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.month || !newTransaction.year || !newTransaction.base_salary) return;

    setIsAddingTransaction(true);
    try {
      // API call would go here
      console.log("Adding salary transaction:", newTransaction);
      // const createdRecord = await employeeAPI.createSalaryRecord(employeeId, newTransaction);
      // onSalaryRecordsUpdate([...salaryRecords, createdRecord]);

      setShowAddTransactionModal(false);
      setNewTransaction({
        month: "",
        year: new Date().getFullYear().toString(),
        base_salary: "",
        overtime_hours: "",
        overtime_rate: "",
        bonuses: "",
        deductions: "",
      });
    } catch (error) {
      console.error("Error adding salary transaction:", error);
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleDeleteSalaryRecord = async () => {
    if (!salaryToDelete) return;

    setIsDeletingSalary(true);
    try {
      // API call would go here
      console.log("Deleting salary record:", salaryToDelete);
      // await employeeAPI.deleteSalaryRecord(salaryToDelete);
      // onSalaryRecordsUpdate(salaryRecords.filter(r => r.id !== salaryToDelete));

      setShowSalaryDeleteModal(false);
      setSalaryToDelete(null);
    } catch (error) {
      console.error("Error deleting salary record:", error);
    } finally {
      setIsDeletingSalary(false);
    }
  };

  return (
    <>
      {/* The arithmetic the owner actually checks at payday: earned, minus
          everything already handed over, leaves what is still due. */}
      {ledger && (
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট আয় করেছে</div>
            <div className="stat-value num">
              {formatCurrencyWithSymbol(ledger.earned)}
            </div>
            <div className="stat-meta">সব মাস মিলিয়ে</div>
          </div>
          <div className="stat">
            <div className="stat-label">অগ্রিম নিয়েছে</div>
            <div className="stat-value num text-amber-600">
              {formatCurrencyWithSymbol(
                payments
                  .filter((p) => p.kind === "advance")
                  .reduce((sum, p) => sum + p.amount, 0)
              )}
            </div>
            <div className="stat-meta">বেতন থেকে কাটা যাবে</div>
          </div>
          <div className="stat">
            <div className="stat-label">মোট নিয়েছে</div>
            <div className="stat-value num">
              {formatCurrencyWithSymbol(ledger.paid)}
            </div>
            <div className="stat-meta">অগ্রিমসহ</div>
          </div>
          <div className="stat">
            <div className="stat-label">
              {ledger.outstanding >= 0 ? "এখনো পাবে" : "বেশি নিয়েছে"}
            </div>
            <div
              className={`stat-value num ${
                ledger.outstanding >= 0 ? "money-neg" : "text-amber-600"
              }`}
            >
              {formatCurrencyWithSymbol(Math.abs(ledger.outstanding))}
            </div>
            <div className="stat-meta">
              {ledger.outstanding >= 0
                ? "অগ্রিম বাদ দেওয়ার পর"
                : "আয়ের চেয়ে বেশি"}
            </div>
          </div>
        </div>
      )}

      <div className="plane-section">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="section-title mb-0">বেতনের হিসাব</div>
          <button
            onClick={() => setShowAddTransactionModal(true)}
            className="btn btn-primary"
          >
            নতুন হিসাব যোগ করুন
          </button>
        </div>
      </div>

      {salaryRecords.length > 0 ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>সময়</th>
                <th className="cell-num">মূল বেতন</th>
                <th className="cell-num">ওভারটাইম</th>
                <th className="cell-num">বোনাস</th>
                <th className="cell-num">কাটা</th>
                <th className="cell-num">হাতে পাবে</th>
                <th>দেওয়ার তারিখ</th>
                <th>অবস্থা</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salaryRecords.map((record) => (
                <tr key={record.id}>
                  <td className="cell-strong">
                    {MONTH_LABELS[record.month] ?? record.month} {record.year}
                  </td>
                  <td className="cell-num">
                    {formatCurrencyWithSymbol(record.base_salary)}
                  </td>
                  <td className="cell-num">
                    {record.overtime_hours > 0 ? (
                      <>
                        <div>{record.overtime_hours} ঘণ্টা</div>
                        <div className="text-xs text-slate-500">
                          @ {formatCurrencyWithSymbol(record.overtime_rate)}/ঘণ্টা
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="cell-num money-pos">
                    {record.bonuses > 0 ? formatCurrencyWithSymbol(record.bonuses) : "-"}
                  </td>
                  <td className="cell-num money-neg">
                    {record.deductions > 0 ? `-${formatCurrencyWithSymbol(record.deductions)}` : "-"}
                  </td>
                  <td className="cell-num cell-strong">
                    {formatCurrencyWithSymbol(record.net_salary)}
                  </td>
                  <td>{formatDate(record.payment_date)}</td>
                  <td>
                    <span className={getStatusColor(record.status)}>
                      {STATUS_LABELS[record.status] ?? record.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        setSalaryToDelete(record.id);
                        setShowSalaryDeleteModal(true);
                      }}
                      className="text-slate-500 hover:text-cyan-600"
                      aria-label="বেতনের হিসাব ডিলিট করুন"
                      title="বেতনের হিসাব ডিলিট করুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <p>এখনো কোনো বেতনের হিসাব নেই</p>
          <button
            onClick={() => setShowAddTransactionModal(true)}
            className="btn btn-primary mt-4"
          >
            প্রথম হিসাব যোগ করুন
          </button>
        </div>
      )}

      {/* ── what was actually handed over ────────────────────────── */}
      <div className="plane-section">
        <div className="section-title mb-0">অগ্রিম ও বেতন দেওয়ার হিস্ট্রি</div>
        <p className="mt-1 text-xs text-slate-500">
          অগ্রিম যা নিয়েছে সেটা উপরের &quot;এখনো পাবে&quot; থেকে বাদ দেওয়া আছে
        </p>
      </div>

      {payments.length > 0 ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>কবে</th>
                <th>কী হিসেবে</th>
                <th>কীভাবে</th>
                <th>কোন মাসের</th>
                <th>নোট</th>
                <th className="cell-num">টাকা</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="num">{formatDate(payment.paid_on)}</td>
                  <td>
                    <span
                      className={
                        payment.kind === "advance"
                          ? "badge badge-warn"
                          : "badge badge-success"
                      }
                    >
                      {KIND_LABEL[payment.kind] ?? payment.kind}
                    </span>
                  </td>
                  <td className="text-slate-600">
                    {METHOD_LABEL[payment.method] ?? payment.method}
                  </td>
                  <td className="text-slate-600">{payment.period ?? "—"}</td>
                  <td className="text-slate-600">{payment.note ?? "—"}</td>
                  <td
                    className={`cell-num num font-semibold ${
                      payment.kind === "advance" ? "text-amber-600" : ""
                    }`}
                  >
                    −{formatCurrencyWithSymbol(payment.amount)}
                  </td>
                  <td className="cell-num">
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => removePayment(payment.id)}
                        aria-label="এই পেমেন্টটা বাতিল করুন"
                        title="ভুল করে দিলে বাতিল করুন"
                        className="text-slate-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          এখনো কোনো অগ্রিম বা বেতন দেওয়া হয়নি।
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="modal-backdrop">
          <div className="modal">
            {/* Modal Header */}
            <div className="modal-head">
              <h2 className="modal-title">
                বেতনের হিসাব যোগ করুন
              </h2>
              <button
                onClick={() => setShowAddTransactionModal(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Month */}
                <div>
                  <label className="label">মাস *</label>
                  <select
                    value={newTransaction.month}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        month: e.target.value,
                      })
                    }
                    className="select"
                  >
                    <option value="">মাস বেছে নিন</option>
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map(month => (
                      <option key={month} value={month}>{MONTH_LABELS[month] ?? month}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="label">বছর *</label>
                  <input
                    type="number"
                    value={newTransaction.year}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        year: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="2024"
                  />
                </div>
              </div>

              {/* Base Salary */}
              <div>
                <label className="label">মূল বেতন *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.base_salary}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      base_salary: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="মূল বেতনের অঙ্ক লিখুন"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Overtime Hours */}
                <div>
                  <label className="label">ওভারটাইম ঘণ্টা</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTransaction.overtime_hours}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        overtime_hours: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="0"
                  />
                </div>

                {/* Overtime Rate */}
                <div>
                  <label className="label">ঘণ্টা প্রতি রেট</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.overtime_rate}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        overtime_rate: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bonuses */}
                <div>
                  <label className="label">বোনাস</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.bonuses}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        bonuses: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                {/* Deductions */}
                <div>
                  <label className="label">কাটা</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.deductions}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        deductions: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-foot">
              <button
                onClick={() => setShowAddTransactionModal(false)}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={isAddingTransaction || !newTransaction.month || !newTransaction.year || !newTransaction.base_salary}
                className="btn btn-primary"
              >
                {isAddingTransaction ? "যোগ হচ্ছে…" : "যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Salary Record Confirmation Modal */}
      {showSalaryDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "28rem" }}>
            {/* Modal Header */}
            <div className="modal-head">
              <h2 className="modal-title">
                বেতনের হিসাব ডিলিট করবেন?
              </h2>
              <button
                onClick={() => setShowSalaryDeleteModal(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                এই বেতনের হিসাবটা ডিলিট করে দেবেন? এটা আর ফেরানো যাবে না।
              </p>
            </div>

            {/* Modal Footer */}
            <div className="modal-foot">
              <button
                onClick={() => setShowSalaryDeleteModal(false)}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteSalaryRecord}
                disabled={isDeletingSalary}
                className="btn btn-danger"
              >
                {isDeletingSalary ? "ডিলিট হচ্ছে…" : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
