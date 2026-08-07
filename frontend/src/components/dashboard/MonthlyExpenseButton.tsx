"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { ApiService } from "@/lib/api";
import { printSheet } from "@/lib/printSheet";

/**
 * "মাসের খরচের রিপোর্ট" — one month's spending, itemised, as a printable PDF.
 *
 * The dashboard already shows a total; a total is not something you can hand to
 * an accountant or check against a bank statement. This pulls the month apart:
 * which employee got how much and when, which bill was paid on which date,
 * which loan instalment went out.
 *
 * The server decides what the sections are and what columns each one has, so a
 * new kind of cost appears in the report without a change here. This component
 * only knows how to turn {columns, rows} into a table.
 */

interface Column {
  key: string;
  label: string;
  numeric?: boolean;
}

interface Section {
  key: string;
  title: string;
  note?: string;
  columns: Column[];
  rows: Record<string, string | number>[];
  /** "দিতে হবে X · দেওয়া হয়েছে Y · বাকি Z" — both halves, never one. */
  total_text: string;
}

interface Report {
  month: { key: string; label: string; start: string; end: string };
  shop: { name: string; address: string };
  calendar: { days: number; open_days: number; closed_label: string };
  summary: {
    key: string;
    label: string;
    amount_text: string;
    paid_text: string;
    count: number;
  }[];
  sections: Section[];
  grand_total_text: string;
  paid_total_text: string;
  outstanding_total_text: string;
  per_open_day_text: string;
  months: { key: string; label: string }[];
}

/** This month and the eleven before it, as "YYYY-MM" with a Bangla label. */
const MONTHS_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

function recentMonths(count = 12) {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const when = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS_BN[when.getMonth()]} ${when.getFullYear()}`,
    });
  }
  return out;
}

export default function MonthlyExpenseButton() {
  const months = recentMonths();
  const [month, setMonth] = useState(months[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const report: Report = await ApiService.getMonthlyExpenses(month);

      if (!report.sections?.length) {
        setError(`${report.month.label} মাসে কোনো খরচ লেখা হয়নি।`);
        return;
      }

      const opened = printSheet({
        title: `খরচের রিপোর্ট — ${report.month.label}`,
        subtitle: [
          report.shop.name,
          `${report.month.label}`,
          report.calendar.closed_label || null,
        ]
          .filter(Boolean)
          .join(" · "),
        // The three that matter first: what the month costs, what has gone
        // out, what is still owed. A single "total" hid an unpaid rent.
        cards: [
          { label: "মাসের মোট খরচ", value: report.grand_total_text },
          { label: "দেওয়া হয়েছে", value: report.paid_total_text },
          { label: "এখনো বাকি", value: report.outstanding_total_text },
          { label: "খোলার দিনে গড়ে", value: report.per_open_day_text },
          ...report.summary
            .filter((row) => row.count > 0)
            .map((row) => ({ label: row.label, value: row.amount_text })),
        ],
        sections: report.sections.map((section) => ({
          title: section.title,
          note: section.note,
          head: section.columns.map((column) => column.label),
          rows: section.rows.map((row) =>
            section.columns.map((column) => row[column.key] ?? "—")
          ),
          numericColumns: section.columns
            .map((column, index) => (column.numeric ? index : -1))
            .filter((index) => index >= 0),
          total: section.total_text,
        })),
        footNote: `${report.month.label} — মোট খরচ ${report.grand_total_text} · দেওয়া হয়েছে ${report.paid_total_text} · বাকি ${report.outstanding_total_text}`,
      });

      if (!opened) {
        setError("পপ-আপ ব্লক করা আছে। এই সাইটের পপ-আপ চালু করে আবার চেষ্টা করুন।");
      }
    } catch {
      setError("রিপোর্ট আনা গেল না। একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        value={month}
        onChange={(event) => setMonth(event.target.value)}
        className="select select-sm num w-auto"
        aria-label="কোন মাসের খরচ"
        disabled={busy}
      >
        {months.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="btn btn-sm btn-ghost gap-1.5"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {busy ? "তৈরি হচ্ছে…" : "খরচের রিপোর্ট"}
      </button>
      {error && (
        <p className="w-full text-right text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
