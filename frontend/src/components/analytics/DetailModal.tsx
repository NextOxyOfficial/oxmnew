"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ApiService } from "@/lib/api";
import SmsReminderButton from "@/components/ui/SmsReminderButton";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import Pagination from "@/components/ui/Pagination";
import type { DetailPayload } from "@/lib/analytics";

interface Props {
  topic: string;
  period: string;
  start?: string;
  end?: string;
  onClose: () => void;
}

const PAGE_SIZE = 12;

/**
 * The rows behind one analytics signal.
 *
 * The backend describes its own columns, so this renders any topic — idle
 * products, overdue customers, every expense — without a component per topic.
 * Adding a new drill-down server-side needs no change here.
 */
export default function AnalyticsDetailModal({
  topic,
  period,
  start,
  end,
  onClose,
}: Props) {
  const formatCurrency = useCurrencyFormatter();

  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await ApiService.getAnalyticsDetail({ topic, period, start, end })
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "বিস্তারিত আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [topic, period, start, end]);

  useEffect(() => {
    load();
  }, [load]);

  // Escape closes — a table this long is easy to get stuck inside.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = data?.rows ?? [];
  // Only debt lists carry a phone number, and only those can be chased.
  const canRemind = rows.some((row) => row.phone && row.due);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderCell = (
    column: DetailPayload["columns"][number],
    row: Record<string, unknown>
  ) => {
    const value = row[column.key];

    if (column.type === "money") {
      const amount = Number(value) || 0;
      const tone =
        column.tone === "neg"
          ? "money-neg"
          : column.tone === "auto"
          ? amount >= 0
            ? "money-pos"
            : "money-neg"
          : "";
      return <span className={`num ${tone}`}>{formatCurrency(amount)}</span>;
    }

    if (column.type === "link" && typeof row.href === "string") {
      return (
        <Link href={row.href} className="hover:text-cyan-700">
          {String(value ?? "—")}
        </Link>
      );
    }

    if (column.type === "number") {
      return <span className="num">{String(value ?? 0)}</span>;
    }

    return <span>{value === null || value === "" ? "—" : String(value)}</span>;
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal max-w-4xl">
        <div className="modal-head">
          <h2 className="modal-title">{data?.title ?? "বিস্তারিত"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="btn btn-ghost btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="empty">বিস্তারিত আনা হচ্ছে…</div>
          ) : error ? (
            <div className="empty">
              <p>{error}</p>
              <button onClick={load} className="btn btn-ghost btn-sm mt-2">
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty">এখানে দেখানোর মতো কিছু নেই।</div>
          ) : (
            <>
              {data?.note && (
                <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {data.note}
                </p>
              )}

              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      {/* Reminder column only when the rows carry a phone
                          number — the debt topics do, the cost ones do not. */}
                      {data!.columns.map((column) => (
                        <th
                          key={column.key}
                          className={
                            column.type === "money" || column.type === "number"
                              ? "cell-num"
                              : ""
                          }
                        >
                          {column.label}
                        </th>
                      ))}
                      {canRemind && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row, index) => (
                      <tr key={String(row.id ?? index)}>
                        {data!.columns.map((column) => (
                          <td
                            key={column.key}
                            className={
                              column.type === "money" || column.type === "number"
                                ? "cell-num"
                                : column.type === "link"
                                ? "cell-strong"
                                : ""
                            }
                          >
                            {renderCell(column, row)}
                          </td>
                        ))}
                        {canRemind && (
                          <td className="cell-num">
                            <SmsReminderButton
                              name={String(row.name ?? "")}
                              phone={row.phone as string | null}
                              due={Number(row.due) || undefined}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > PAGE_SIZE && (
                <div className="mt-3">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={rows.length}
                    itemsPerPage={PAGE_SIZE}
                    onPageChange={setPage}
                    onPageSizeChange={() => {
                      /* fixed inside the dialog — the sheet has a fixed height */
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
