"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

/**
 * কেনা দাম, বেচা দাম and লাভ for a chosen stretch of days — today by default.
 *
 * The dashboard and the sales page both used to answer "how big is this shop"
 * with lifetime totals. That number barely moves, so it stops being read; and
 * neither page could answer the question actually asked at the counter — how
 * did *this week* go, or *last Friday*.
 *
 * One component serves both pages so the two can never quote different profit
 * for the same days. It owns its own range: the sales page's existing date
 * filter drives the order list, and tying them together would mean opening a
 * report changed the list under the user.
 */

interface Block {
  orders: number;
  revenue: number;
  avg_order_value: number;
  collected: number;
  cogs?: number;
  profit?: number;
  margin_pct?: number;
}

interface StatsResponse {
  range: Block & { start: string; end: string; is_today: boolean };
  lifetime: Block;
  shows_cost: boolean;
}

/** Local calendar date as YYYY-MM-DD; toISOString would hand back UTC and
 *  file a late-evening report under tomorrow. */
function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function shift(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/** Weeks start on Saturday in Bangladesh, not Monday — same rule the
 *  analytics period picker uses. */
function startOfWeek() {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 1) % 7));
  return date;
}

type PresetKey = "today" | "yesterday" | "this_week" | "this_month" | "custom";

interface Preset {
  key: PresetKey;
  label: string;
  range: () => [string, string];
}

const PRESETS: Preset[] = [
  {
    key: "today",
    label: "আজ",
    range: () => [isoDay(new Date()), isoDay(new Date())],
  },
  {
    key: "yesterday",
    label: "গতকাল",
    range: () => [isoDay(shift(-1)), isoDay(shift(-1))],
  },
  {
    key: "this_week",
    label: "এই সপ্তাহ",
    range: () => [isoDay(startOfWeek()), isoDay(new Date())],
  },
  {
    key: "this_month",
    label: "এই মাস",
    range: () => {
      const now = new Date();
      return [isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), isoDay(now)];
    },
  },
];

export default function SalesRangeReport({
  title = "কেনা-বেচা ও লাভের হিসাব",
  showLifetime = true,
}: {
  title?: string;
  showLifetime?: boolean;
}) {
  const money = useCurrencyFormatter();
  const [preset, setPreset] = useState<PresetKey>("today");
  const [from, setFrom] = useState(isoDay(new Date()));
  const [to, setTo] = useState(isoDay(new Date()));
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await ApiService.getOrderStats({ start_date: from, end_date: to }));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const choose = (key: PresetKey) => {
    setPreset(key);
    const found = PRESETS.find((option) => option.key === key);
    if (!found) return; // "custom" keeps whatever dates are already set
    const [start, end] = found.range();
    setFrom(start);
    setTo(end);
  };

  const range = data?.range;
  const showCost = data?.shows_cost !== false;

  const cards = useMemo(() => {
    const rows: { label: string; value: string; meta?: string; tone?: string }[] = [
      {
        label: "অর্ডার",
        value: String(range?.orders ?? 0),
        meta: range?.orders
          ? `গড়ে ${money(range.avg_order_value || 0)}`
          : "এই সময়ে কোনো বিক্রি নেই",
      },
      {
        label: "বেচা দাম",
        value: money(range?.revenue ?? 0),
        meta: `হাতে এসেছে ${money(range?.collected ?? 0)}`,
        tone: "money-pos",
      },
    ];
    if (showCost) {
      rows.push({
        label: "কেনা দাম",
        value: money(range?.cogs ?? 0),
        meta: "যা বিক্রি হয়েছে তার কেনা মূল্য",
        tone: "money-neg",
      });
      rows.push({
        label: "লাভ",
        value: money(range?.profit ?? 0),
        // Margin is the number that says whether the day was worth opening;
        // revenue on its own can rise while profit falls.
        meta: `মার্জিন ${range?.margin_pct ?? 0}%`,
        tone: (range?.profit ?? 0) >= 0 ? "money-pos" : "money-neg",
      });
    }
    return rows;
  }, [range, showCost, money]);

  return (
    <div className="plane-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="section-title mb-0">{title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => choose(option.key)}
              className={`btn btn-sm ${
                preset === option.key ? "btn-primary" : "btn-ghost"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={`btn btn-sm ${
              preset === "custom" ? "btn-primary" : "btn-ghost"
            }`}
          >
            নিজের তারিখ
          </button>
        </div>
      </div>

      {preset === "custom" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="label mb-0 shrink-0" htmlFor="report-from">
            শুরু
          </label>
          <input
            id="report-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className="input input-sm num w-auto"
          />
          <label className="label mb-0 shrink-0" htmlFor="report-to">
            শেষ
          </label>
          <input
            id="report-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className="input input-sm num w-auto"
          />
        </div>
      )}

      {failed ? (
        <p className="mt-3 text-sm text-rose-600">
          হিসাব আনা গেল না।{" "}
          <button type="button" onClick={load} className="underline">
            আবার চেষ্টা করুন
          </button>
        </p>
      ) : (
        <div className="stat-strip mt-3 rounded-lg border border-slate-200">
          {cards.map((card) => (
            <div key={card.label} className="stat">
              <div className="stat-label">{card.label}</div>
              {loading ? (
                <div className="mt-1 space-y-1">
                  <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                </div>
              ) : (
                <>
                  <div className={`stat-value num ${card.tone ?? ""}`}>
                    {card.value}
                  </div>
                  <div className="stat-meta">{card.meta}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showLifetime && data?.lifetime && (
        <p className="mt-2 text-xs text-slate-500">
          সব মিলিয়ে এ পর্যন্ত:{" "}
          <span className="num">{data.lifetime.orders}</span> টা অর্ডার ·{" "}
          <span className="num">{money(data.lifetime.revenue)}</span> বিক্রি
          {showCost && (
            <>
              {" "}
              · <span className="num">{money(data.lifetime.profit ?? 0)}</span> লাভ
            </>
          )}
        </p>
      )}
    </div>
  );
}
