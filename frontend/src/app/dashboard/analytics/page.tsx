"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import AnalyticsDetailModal from "@/components/analytics/DetailModal";
import PagedTable from "@/components/analytics/PagedTable";
import {
  buildAnalyticsSections,
  printAnalyticsReport,
} from "@/lib/analyticsReport";
import { countdownText } from "@/lib/loans";
import SmsReminderButton from "@/components/ui/SmsReminderButton";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Feedback";
import {
  AnalyticsOverview,
  Change,
  PERIOD_OPTIONS,
  SEVERITY_STYLE,
  changeText,
  changeTone,
  daysSince,
} from "@/lib/analytics";

/** One "X vs previous period" line, used across the comparison table. */
function ComparisonRow({
  label,
  change,
  goodWhenUp = true,
  format,
}: {
  label: string;
  change: Change;
  goodWhenUp?: boolean;
  format: (value: number) => string;
}) {
  const Icon =
    change.change > 0 ? TrendingUp : change.change < 0 ? TrendingDown : Minus;
  return (
    <tr>
      <td className="cell-strong">{label}</td>
      <td className="cell-num num">{format(change.current)}</td>
      <td className="cell-num num text-slate-500">{format(change.previous)}</td>
      <td className="cell-num">
        <span
          className={`inline-flex items-center gap-1 num ${changeTone(
            change,
            goodWhenUp
          )}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {changeText(change)}
        </span>
      </td>
    </tr>
  );
}

export default function AnalyticsPage() {
  const formatCurrency = useCurrencyFormatter();
  const { profile } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  // Which drill-down is open, if any.
  const [detailTopic, setDetailTopic] = useState<string | null>(null);

  const load = useCallback(async () => {
    // A custom range is only sendable once both ends are filled in.
    if (period === "custom" && !(customStart && customEnd)) return;

    setLoading(true);
    try {
      setData(
        await ApiService.getAnalyticsOverview({
          period,
          start: period === "custom" ? customStart : undefined,
          end: period === "custom" ? customEnd : undefined,
        })
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "রিপোর্ট আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    load();
  }, [load]);

  // "Nothing happened" is a different answer from "you broke even".
  const hasActivity = Boolean(
    data &&
      (data.sales.revenue !== 0 ||
        data.costs.total !== 0 ||
        data.sales.orders_count > 0)
  );

  const money = (value: number) => formatCurrency(value);
  const plain = (value: number) => String(Math.round(value));

  const downloadReport = () => {
    if (!data) return;
    const label =
      PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
    const ok = printAnalyticsReport({
      title: "অ্যানালিটিক্স রিপোর্ট",
      periodLabel: label,
      storeName: profile?.company || undefined,
      cards: [
        { label: "বিক্রি", value: money(data.sales.revenue) },
        {
          label: "বিক্রির লাভ",
          value: money(data.sales.gross_profit),
          tone: "pos",
        },
        { label: "খরচ", value: money(data.costs.total), tone: "neg" },
        {
          label: data.net.is_profit ? "নিট লাভ" : "ঘাটতি",
          value: money(Math.abs(data.net.profit)),
          tone: data.net.is_profit ? "pos" : "neg",
        },
      ],
      verdict: {
        text: data.net.is_profit
          ? `এই সময়ে ${money(Math.abs(data.net.profit))} লাভ হয়েছে (মার্জিন ${
              data.net.margin_pct
            }%)।`
          : `এই সময়ে ${money(Math.abs(data.net.profit))} ঘাটতি হয়েছে — খরচ বিক্রির চেয়ে বেশি।`,
        tone: data.net.is_profit ? "pos" : "neg",
      },
      sections: buildAnalyticsSections(data, money),
    });
    if (!ok) {
      toast.error("পপ-আপ ব্লক করা আছে — ব্রাউজারে অনুমতি দিন");
    }
  };

  return (
    <div className="page space-y-4">
      <div className="page-head">
        <div>
          <h1 className="page-title">অ্যানালিটিক্স</h1>
          <p className="page-sub">
            বিক্রি, খরচ আর বাকি এক জায়গায় — লাভ না ক্ষতি, আর কোথায় নজর দিতে হবে
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadReport}
            className="btn btn-ghost"
            disabled={!data}
          >
            <Download className="h-4 w-4" />
            রিপোর্ট নামান
          </button>
          <button onClick={load} className="btn btn-ghost" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      <div className="plane">
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`btn btn-sm ${
                  period === option.value ? "btn-primary" : "btn-ghost"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="label">শুরু</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input w-auto"
                />
              </div>
              <div>
                <label className="label">শেষ</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input w-auto"
                />
              </div>
              {!(customStart && customEnd) && (
                <p className="pb-2 text-xs text-slate-500">
                  দুটো তারিখই দিলে রিপোর্ট আসবে
                </p>
              )}
            </div>
          )}
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
        ) : loading || !data ? (
          <div className="plane-section">
            <div className="empty">হিসাব করা হচ্ছে…</div>
          </div>
        ) : (
          <>
            {/* ── the verdict ─────────────────────────────────────── */}
            <div className="plane-section">
              <div className="section-title">
                {data.period.label} — {data.period.start} থেকে {data.period.end}
              </div>

              {/* A period with no sales and no costs is not a profitable one —
                  claiming "লাভে আছেন ৳0" would be nonsense. Say there is
                  nothing to report and point at what to do about it. */}
              {hasActivity ? (
                <div
                  className={`rounded-lg border px-4 py-3 ${
                    data.net.is_profit
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {data.net.is_profit ? "লাভে আছেন" : "লোকসানে আছেন"}
                    </span>
                    <span
                      className={`num text-2xl font-semibold ${
                        data.net.is_profit ? "money-pos" : "money-neg"
                      }`}
                    >
                      {money(Math.abs(data.net.profit))}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-xs">
                    {(
                      [
                        ["বিক্রি হয়েছে", data.sales.revenue, ""],
                        ["যত দামে কিনেছিলেন", -data.sales.cogs, "বাদ"],
                        ["বিক্রির লাভ", data.sales.gross_profit, "="],
                        ["ব্যবসার খরচ বাবদ", -data.costs.total, "বাদ"],
                      ] as [string, number, string][]
                    ).map(([label, value, sign]) => (
                      <div
                        key={label}
                        className={`flex items-baseline justify-between gap-3 ${
                          sign === "=" ? "border-t border-black/10 pt-1" : ""
                        }`}
                      >
                        <dt className="text-slate-600">
                          {sign && sign !== "=" ? `${sign} ` : ""}
                          {label}
                        </dt>
                        <dd
                          className={`num ${
                            value < 0 ? "text-slate-700" : "text-slate-900"
                          }`}
                        >
                          {money(Math.abs(value))}
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-3 border-t border-black/10 pt-1 font-semibold">
                      <dt>{data.net.is_profit ? "থাকল" : "ঘাটতি"}</dt>
                      <dd
                        className={`num ${
                          data.net.is_profit ? "money-pos" : "money-neg"
                        }`}
                      >
                        {money(Math.abs(data.net.profit))} ({data.net.margin_pct}%)
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-medium text-slate-700">
                    এই সময়ে কোনো লেনদেন হয়নি
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {data.period.label}-এ কোনো বিক্রিও নেই, খরচও তোলা হয়নি — তাই
                    লাভ-ক্ষতির হিসাব করার মতো কিছু নেই। উপর থেকে অন্য সময় বেছে
                    দেখুন, নয়তো বিক্রি আর খরচ তুলে নিন।
                  </p>
                  {data.receivables.total > 0 && (
                    <p className="mt-2 text-xs font-medium text-slate-800">
                      → তবে {data.receivables.customers_count} জনের কাছে{" "}
                      {money(data.receivables.total)} টাকা এখনো বাকি আছে, সেটা
                      নিচে দেখুন।
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="stat-strip">
              <div className="stat">
                <div className="stat-label">বিক্রি</div>
                <div className="stat-value num">{money(data.sales.revenue)}</div>
                <div className="stat-meta">{data.sales.orders_count} টা অর্ডার</div>
              </div>
              <div className="stat">
                <div className="stat-label">বিক্রির লাভ</div>
                <div className="stat-value num money-pos">
                  {money(data.sales.gross_profit)}
                </div>
                <div className="stat-meta">খরচ বাদ দেওয়ার আগে</div>
              </div>
              <div className="stat">
                <div className="stat-label">মোট খরচ</div>
                <div className="stat-value num money-neg">
                  {money(data.costs.total)}
                </div>
                <div className="stat-meta">
                  {data.costs.by_category[0]
                    ? `সবচেয়ে বেশি ${data.costs.by_category[0].label}`
                    : `দিনে গড়ে ${money(data.targets.daily_cost)}`}
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">বাকি পাওনা</div>
                <div className="stat-value num money-neg">
                  {money(data.receivables.total)}
                </div>
                <div className="stat-meta">
                  {data.receivables.customers_count} জনের কাছে
                </div>
              </div>
            </div>

            {/* ── what to do, and the daily target it implies ─────────
                Side by side on desktop: the target is the number that makes
                the advice actionable, so reading one should not mean
                scrolling away from the other. */}
            <div className="plane-section lg:grid lg:grid-cols-[1fr_1.6fr] lg:gap-6">
            <div className="mt-6 border-t border-slate-200 pt-4 lg:mt-0 lg:border-r lg:border-t-0 lg:pr-6 lg:pt-0">
              <div className="section-title">দিনের টার্গেট</div>
              {data.targets.has_costs && data.targets.has_margin ? (
                <>
                  {/* A checklist, not three loose numbers: each line says what
                      the figure is and whether it has been met. */}
                  <ol className="divide-y divide-slate-200">
                    {[
                      {
                        title: "খরচ উঠতে দিনে বিক্রি",
                        value: data.targets.breakeven_daily_revenue,
                        note: "এর নিচে নামলেই লোকসান",
                        done: data.targets.on_track,
                      },
                      {
                        title: "লাভসহ দিনের টার্গেট",
                        value: data.targets.target_daily_revenue,
                        note: "খরচের 20% লাভ ধরে",
                        done:
                          data.targets.daily_revenue >=
                          data.targets.target_daily_revenue,
                      },
                      {
                        title: "এখন হচ্ছে",
                        value: data.targets.daily_revenue,
                        note: data.targets.on_track
                          ? "টার্গেটের উপরে আছেন"
                          : `দিনে ${money(Math.abs(data.targets.gap))} কম পড়ছে`,
                        done: data.targets.on_track,
                        plain: true,
                      },
                    ].map((row, index) => (
                      <li
                        key={row.title}
                        className="flex items-start justify-between gap-3 py-2.5"
                      >
                        <span className="flex min-w-0 items-start gap-2.5">
                          <span
                            className={`num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                              row.done
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {row.done ? "✓" : index + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm text-slate-800">
                              {row.title}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {row.note}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`num shrink-0 text-sm font-semibold ${
                            row.plain
                              ? row.done
                                ? "money-pos"
                                : "money-neg"
                              : "text-slate-900"
                          }`}
                        >
                          {money(row.value)}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {data.loans.monthly_due > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-700">
                        লোনের কিস্তির হিসাব
                      </div>
                      <dl className="mt-1.5 space-y-1 text-xs">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-slate-500">মাসে দিতে হয়</dt>
                          <dd className="num text-slate-800">
                            {money(data.loans.monthly_due)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-slate-500">দিনে গড়ে</dt>
                          <dd className="num text-slate-800">
                            {money(data.targets.loan_share_daily)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-1">
                          <dt className="text-slate-500">
                            এই সময়ে দিয়েছেন
                          </dt>
                          <dd className="num font-semibold money-neg">
                            {money(data.costs.loan)}
                          </dd>
                        </div>
                      </dl>
                      {data.costs.loan > 0 && (
                        <p className="mt-1.5 text-xs text-slate-500">
                          এই টাকাটা এই সময়ের খরচে ধরা আছে, তাই লাভের অঙ্ক থেকে
                          বাদ গেছে।
                        </p>
                      )}
                    </div>
                  )}

                  {data.fixed_costs.count > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-slate-700">
                          নির্দিষ্ট মাসিক খরচ
                        </span>
                        <Link
                          href="/dashboard/employees/office-rent"
                          className="text-xs font-medium text-cyan-700 hover:underline"
                        >
                          দেখুন
                        </Link>
                      </div>
                      <dl className="mt-1.5 space-y-1 text-xs">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-slate-500">মাসে দিতে হয়</dt>
                          <dd className="num text-slate-800">
                            {money(data.fixed_costs.monthly_total)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-slate-500">দিনে গড়ে</dt>
                          <dd className="num text-slate-800">
                            {money(data.fixed_costs.monthly_total / 30)}
                          </dd>
                        </div>
                        {data.fixed_costs.unpaid_count > 0 && (
                          <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-1">
                            <dt className="text-slate-500">এই মাসে বাকি</dt>
                            <dd className="num font-semibold money-neg">
                              {money(data.fixed_costs.unpaid_amount)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* What to actually do about it, in order of impact. */}
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                    <div className="text-xs font-medium text-slate-700">
                      টার্গেটে পৌঁছাতে
                    </div>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                      <li>
                        • লাভের হার {data.targets.margin_pct}% — 100 টাকা খরচ
                        উঠতে{" "}
                        {money(100 / (data.targets.margin_pct / 100 || 1))} টাকার
                        বিক্রি লাগে
                      </li>
                      {!data.targets.on_track && (
                        <li>
                          • প্রতিদিন আরও {money(Math.abs(data.targets.gap))} টাকা
                          বিক্রি করতে হবে
                        </li>
                      )}
                      {data.receivables.total > 0 && (
                        <li>
                          • {money(data.receivables.total)} টাকা বাকি তুলতে পারলে
                          নতুন বিক্রি ছাড়াই হাতে টাকা আসবে
                        </li>
                      )}
                      {data.loans.monthly_due > 0 && (
                        <li>
                          • এর মধ্যে লোনের কিস্তি বাবদ দিনে{" "}
                          {money(data.targets.loan_share_daily)} ধরা আছে
                        </li>
                      )}
                      {data.fixed_costs.monthly_total > 0 && (
                        <li>
                          • অফিস ভাড়াসহ নির্দিষ্ট খরচ বাবদ দিনে{" "}
                          {money(data.fixed_costs.monthly_total / 30)} ধরা আছে
                        </li>
                      )}
                      <li>
                        • সবচেয়ে বড় খরচ{" "}
                        {data.costs.by_category[0]?.label ?? "—"} (
                        {money(data.costs.by_category[0]?.amount ?? 0)}) —
                        কমাতে পারলে টার্গেটও নামবে
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="empty">
                  টার্গেট বের করতে খরচের হিসাব দরকার। ব্যাংকিং-এ খরচগুলো তুললে
                  এখানে দিনের টার্গেট দেখা যাবে।
                </div>
              )}
            </div>

            <div>
              <div className="section-title">কোথায় নজর দিতে হবে</div>
              <div className="space-y-2">
                {data.focus.map((signal, index) => {
                  const style = SEVERITY_STYLE[signal.severity];
                  return (
                    <div
                      key={index}
                      className={`rounded-lg border px-3 py-2.5 ${style.box}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={style.badge}>{style.label}</span>
                        <span className="text-sm font-medium text-slate-900">
                          {signal.title}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{signal.detail}</p>
                      <p className="mt-1 text-xs font-medium text-slate-800">
                        → {signal.action}
                      </p>
                      {signal.topic && (
                        <button
                          type="button"
                          onClick={() => setDetailTopic(signal.topic)}
                          className="btn btn-ghost btn-sm mt-2 bg-white/70"
                        >
                          কোনগুলো দেখুন
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            </div>

            {/* ── comparison ──────────────────────────────────────── */}
            <div className="plane-section">
              <div className="section-title">
                {data.compare_with.label}-এর সাথে তুলনা
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>কী</th>
                      <th className="cell-num">{data.period.label}</th>
                      <th className="cell-num">{data.compare_with.label}</th>
                      <th className="cell-num">বদল</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      label="বিক্রি"
                      change={data.comparison.revenue}
                      format={money}
                    />
                    <ComparisonRow
                      label="বিক্রির লাভ"
                      change={data.comparison.gross_profit}
                      format={money}
                    />
                    <ComparisonRow
                      label="খরচ"
                      change={data.comparison.cost}
                      goodWhenUp={false}
                      format={money}
                    />
                    <ComparisonRow
                      label="নিট লাভ"
                      change={data.comparison.net_profit}
                      format={money}
                    />
                    <ComparisonRow
                      label="অর্ডার"
                      change={data.comparison.orders}
                      format={plain}
                    />
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                তুলনার সময়: {data.compare_with.start} থেকে {data.compare_with.end}{" "}
                — দুই দিকেই {data.period.days} দিন ধরা হয়েছে।
              </p>
            </div>

            {/* ── cost breakdown ──────────────────────────────────── */}
            <div className="plane-section">
              <div className="section-title">খরচের ভাঙন</div>
              {data.costs.total === 0 ? (
                <div className="empty">
                  এই সময়ে কোনো খরচ তোলা হয়নি। ব্যাংকিং-এ খরচ যোগ করলে এখানে
                  দেখাবে।
                </div>
              ) : (
                <>
                  {/* Fixed vs variable, because the two need different actions:
                      a fixed bill can only be renegotiated, a variable one can
                      be cut this month. */}
                  {(() => {
                    const fixed =
                      data.costs.salaries +
                      data.costs.loan +
                      data.costs.recurring;
                    const variable = Math.max(0, data.costs.total - fixed);
                    const share = (value: number) =>
                      data.costs.total > 0
                        ? ((value / data.costs.total) * 100).toFixed(0)
                        : "0";
                    return (
                      <div className="mt-3 border-t border-slate-200 pt-2.5">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium text-slate-700">
                                বাঁধা খরচ
                              </span>
                              <span className="num text-sm font-semibold">
                                {money(fixed)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              বেতন, ভাড়া ও কিস্তি — বিক্রি না হলেও দিতে হয় (
                              {share(fixed)}%)
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium text-slate-700">
                                চলতি খরচ
                              </span>
                              <span className="num text-sm font-semibold">
                                {money(variable)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              এগুলো কমানো যায় ({share(variable)}%)
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-slate-200 pt-2.5">
                          <span className="text-sm font-medium text-slate-700">
                            মোট খরচ
                          </span>
                          <span className="num text-sm font-semibold money-neg">
                            {money(data.costs.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-3">
                    <PagedTable
                      rows={data.costs.by_category}
                      head={
                        <tr>
                          <th>খাত</th>
                          <th className="cell-num">টাকা</th>
                          <th className="cell-num">মোট খরচের</th>
                        </tr>
                      }
                      renderRow={(row) => (
                        <tr key={`${row.category}-${row.label}`}>
                          <td className="cell-strong">{row.label}</td>
                          <td className="cell-num num">{money(row.amount)}</td>
                          <td className="cell-num num text-slate-500">
                            {((row.amount / data.costs.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )}
                    />
                  </div>

                  {data.costs.unclassified > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      {money(data.costs.unclassified)} টাকার খরচে ধরন বসানো নেই —{" "}
                      <Link
                        href="/dashboard/banking"
                        className="font-medium underline"
                      >
                        ব্যাংকিং-এ গিয়ে ঠিক করুন
                      </Link>
                      ।
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── collections ─────────────────────────────────────── */}
            <div className="plane-section">
              <div className="section-title">তাগাদা দিতে হবে</div>
              {data.receivables.top.length === 0 ? (
                <div className="empty">কারো কাছে বাকি নেই। চমৎকার।</div>
              ) : (
                <PagedTable
                  rows={data.receivables.top}
                  head={
                    <tr>
                      <th>কাস্টমার</th>
                      <th>ফোন</th>
                      <th className="cell-num">বাকি</th>
                      <th className="cell-num">অর্ডার</th>
                      <th className="cell-num">কত দিন</th>
                      <th></th>
                    </tr>
                  }
                  renderRow={(row) => {
                    const age = daysSince(row.oldest);
                    return (
                      <tr key={`${row.customer_id ?? row.name}`}>
                        <td className="cell-strong">
                          {row.customer_id ? (
                            <Link
                              href={`/dashboard/customers/${row.customer_id}`}
                              className="hover:text-cyan-700"
                            >
                              {row.name}
                            </Link>
                          ) : (
                            row.name
                          )}
                        </td>
                        <td className="num">{row.phone || "—"}</td>
                        <td className="cell-num num money-neg">{money(row.due)}</td>
                        <td className="cell-num num">{row.orders}</td>
                        <td className="cell-num num">
                          <span className={age > 30 ? "money-neg" : ""}>
                            {age} দিন
                          </span>
                        </td>
                        <td className="cell-num">
                          <SmsReminderButton
                            name={row.name}
                            phone={row.phone}
                            due={row.due}
                            note={`${row.orders} টা অর্ডার`}
                          />
                        </td>
                      </tr>
                    );
                  }}
                />
              )}
              {data.receivables.customers_count > data.receivables.top.length && (
                <p className="mt-2 text-xs text-slate-500">
                  সবচেয়ে বেশি বাকি {data.receivables.top.length} জন দেখানো হলো,
                  মোট {data.receivables.customers_count} জন।{" "}
                  <Link href="/dashboard/duebook" className="font-medium underline">
                    বাকির খাতায় সবাইকে দেখুন
                  </Link>
                  ।
                </p>
              )}
            </div>

            {/* ── loan commitments ────────────────────────────────── */}
            {data.loans.active_count > 0 && (
              <div className="plane-section">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="section-title mb-0">লোন ও কিস্তি</span>
                  <Link href="/dashboard/banking/loans" className="btn btn-ghost btn-sm">
                    সব লোন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="stat-label">মাসিক কিস্তি</div>
                    <div className="stat-value num money-neg">
                      {money(data.loans.monthly_due)}
                    </div>
                    <div className="stat-meta">
                      দিনের টার্গেটে {money(data.targets.loan_share_daily)} ধরা আছে
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">এখনো বাকি</div>
                    <div className="stat-value num">
                      {money(data.loans.outstanding)}
                    </div>
                    <div className="stat-meta">{data.loans.active_count} টা লোন</div>
                  </div>
                  <div>
                    <div className="stat-label">দেরি হয়েছে</div>
                    <div
                      className={`stat-value num ${
                        data.loans.overdue_count > 0 ? "money-neg" : "money-pos"
                      }`}
                    >
                      {data.loans.overdue_count}
                    </div>
                    <div className="stat-meta">
                      {data.loans.overdue_count > 0
                        ? `${money(data.loans.overdue_amount)} বকেয়া`
                        : "সব সময়মতো"}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <PagedTable
                    rows={data.loans.next}
                    head={
                      <tr>
                        <th>কার কাছে</th>
                        <th className="cell-num">কিস্তি</th>
                        <th>পরের তারিখ</th>
                        <th className="cell-num">বাকি কিস্তি</th>
                      </tr>
                    }
                    renderRow={(row) => (
                      <tr key={row.id}>
                        <td className="cell-strong">{row.lender}</td>
                        <td className="cell-num num money-neg">
                          {money(row.installment)}
                        </td>
                        <td className="num">
                          {row.due_date}
                          <div
                            className={`text-xs ${
                              row.is_overdue ? "money-neg" : "text-slate-500"
                            }`}
                          >
                            {countdownText(
                              row.is_overdue
                                ? -row.days_overdue
                                : Math.round(
                                    (new Date(row.due_date).getTime() -
                                      Date.now()) /
                                      86_400_000
                                  )
                            )}
                          </div>
                        </td>
                        <td className="cell-num num">{row.remaining_count} টা</td>
                      </tr>
                    )}
                  />
                </div>
              </div>
            )}

            {/* ── money stuck in stock ────────────────────────────── */}
            <div className="plane-section">
              <div className="section-title">স্টকে আটকে থাকা টাকা</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <div className="stat-label">প্রোডাক্টে</div>
                  <div className="stat-value num">
                    {money(data.inventory.product_value)}
                  </div>
                </div>
                <div>
                  <div className="stat-label">বাইকে</div>
                  <div className="stat-value num">
                    {money(data.inventory.vehicle_value)}
                  </div>
                  <div className="stat-meta">
                    {data.inventory.vehicle_count} টা স্টকে
                  </div>
                </div>
                <div>
                  <div className="stat-label">সব মিলিয়ে</div>
                  <div className="stat-value num">{money(data.inventory.total)}</div>
                  <div className="stat-meta">কেনা দামে</div>
                </div>
              </div>

              {/* The mirror of dead stock: what is moving fast enough that the
                  shelf will not last. Shown first because ordering late costs a
                  sale, while ordering nothing costs only shelf space. */}
              {data.restock?.length > 0 && (
                <>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="section-title mb-0">
                      কোন মাল আরও আনতে হবে
                    </span>
                    <span className="text-xs text-slate-500">
                      14 দিনের স্টক ধরে হিসাব
                    </span>
                  </div>
                  <div className="mt-2">
                    <PagedTable
                      rows={data.restock}
                      head={
                        <tr>
                          <th>প্রোডাক্ট</th>
                          <th className="cell-num">বিক্রি হয়েছে</th>
                          <th className="cell-num">স্টকে</th>
                          <th className="cell-num">আর কত দিন</th>
                          <th className="cell-num">কত পিস আনবেন</th>
                          <th className="cell-num">খরচ পড়বে</th>
                        </tr>
                      }
                      renderRow={(row) => (
                        <tr key={row.id}>
                          <td className="cell-strong">
                            <Link
                              href={`/dashboard/products/${row.id}`}
                              className="hover:text-cyan-700"
                            >
                              {row.name}
                            </Link>
                          </td>
                          <td className="cell-num num">{row.sold} পিস</td>
                          <td className="cell-num num">{row.in_stock}</td>
                          <td
                            className={`cell-num num ${
                              row.days_left <= 7 ? "money-neg" : "text-amber-600"
                            }`}
                          >
                            {row.days_left} দিন
                          </td>
                          <td className="cell-num num font-semibold text-cyan-700">
                            {row.suggest_qty} পিস
                          </td>
                          <td className="cell-num num">{money(row.buy_cost)}</td>
                        </tr>
                      )}
                    />
                  </div>
                </>
              )}

              {data.dead_stock.length > 0 && (
                <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="section-title mb-0">
                    এই সময়ে একটাও বিক্রি হয়নি
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailTopic("dead_stock")}
                    className="btn btn-ghost btn-sm"
                  >
                    সব দেখুন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2">
                  <PagedTable
                    rows={data.dead_stock}
                    head={
                      <tr>
                        <th>প্রোডাক্ট</th>
                        <th className="cell-num">স্টক</th>
                        <th className="cell-num">আটকে আছে</th>
                      </tr>
                    }
                    renderRow={(row) => (
                      <tr key={row.id}>
                        <td className="cell-strong">
                          <Link
                            href={`/dashboard/products/${row.id}`}
                            className="hover:text-cyan-700"
                          >
                            {row.name}
                          </Link>
                        </td>
                        <td className="cell-num num">{row.stock}</td>
                        <td className="cell-num num money-neg">
                          {money(row.tied_up)}
                        </td>
                      </tr>
                    )}
                  />
                </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {detailTopic && (
        <AnalyticsDetailModal
          topic={detailTopic}
          period={period}
          start={period === "custom" ? customStart : undefined}
          end={period === "custom" ? customEnd : undefined}
          onClose={() => setDetailTopic(null)}
        />
      )}
    </div>
  );
}
