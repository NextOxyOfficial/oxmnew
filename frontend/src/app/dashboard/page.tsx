"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bike,
  CalendarClock,
  CreditCard,
  MessageSquare,
  NotebookPen,
  Package,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { AnalyticsOverview } from "@/lib/analytics";
import ReportCard, { ReportRow } from "@/components/dashboard/ReportCard";
import CoachStrip from "@/components/dashboard/CoachStrip";
import MonthlyExpenseButton from "@/components/dashboard/MonthlyExpenseButton";
import {
  DashboardFeed,
  SMS_STATUS,
  VEHICLE_STATUS,
  daysAway,
  shortDate,
} from "@/lib/dashboardFeed";

/** Windows the short overview offers — the same presets analytics uses. */
const RANGE_OPTIONS = [
  { value: "today", label: "আজ" },
  { value: "this_week", label: "এই সপ্তাহ" },
  { value: "this_month", label: "এই মাস" },
  { value: "last_30", label: "গত 30 দিন" },
] as const;

/** How loud each focus signal is, in one word the right column can hold. */
const SEVERITY_WORD: Record<string, string> = {
  danger: "জরুরি",
  warn: "খেয়াল করুন",
  info: "দেখে নিন",
  good: "ভালো",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const formatCurrency = useCurrencyFormatter();

  const [today, setToday] = useState<AnalyticsOverview | null>(null);
  const [month, setMonth] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The short overview reads whichever window the user picks; today and the
  // month above it stay fixed because they answer different questions.
  const [range, setRange] = useState("this_month");
  const [rangeData, setRangeData] = useState<AnalyticsOverview | null>(null);
  const [feed, setFeed] = useState<DashboardFeed | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Today drives the live figures; the month drives the running-cost view.
      // Both come from the analytics endpoint rather than a bespoke one, so the
      // dashboard can never disagree with the analytics screen.
      const [todayData, monthData] = await Promise.all([
        ApiService.getAnalyticsOverview({ period: "today" }),
        ApiService.getAnalyticsOverview({ period: "this_month" }),
      ]);
      setToday(todayData);
      setMonth(monthData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "তথ্য আনা যায়নি");
    } finally {
      setLoading(false);
    }
    // The activity cards load on their own: a slow join in one of them must not
    // hold back the figures above, and an outage there is not worth an error
    // screen — the cards simply stay empty.
    try {
      setFeed(await ApiService.getDashboardFeed());
    } catch {
      setFeed(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    ApiService.getAnalyticsOverview({ period: range })
      .then((data) => {
        if (!cancelled) setRangeData(data);
      })
      .catch(() => {
        if (!cancelled) setRangeData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const money = (value: number) => formatCurrency(value);
  const dateLine = new Date().toLocaleDateString("bn-BD-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading || !today || !month) {
    return (
      <div className="page space-y-4">
        <div className="page-head">
          <div>
            <h1 className="page-title">
              স্বাগতম{user?.first_name ? `, ${user.first_name}` : ""}
            </h1>
            <p className="page-sub">{dateLine}</p>
          </div>
        </div>
        <div className="plane">
          <div className="plane-section">
            <div className="empty">
              {error ? (
                <>
                  <p>{error}</p>
                  <button onClick={load} className="btn btn-ghost btn-sm mt-2">
                    আবার চেষ্টা করুন
                  </button>
                </>
              ) : (
                "আজকের হিসাব আনা হচ্ছে…"
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const commitment = month.monthly_commitment;
  const target = today.targets;
  const toDo = today.to_do;
  // The target is PROFIT, not revenue. Revenue only works as a target when the
  // margin is one number, and this shop's is two: a bike is a big ticket at a
  // thin margin, a spare part a small ticket at a fat one. Quoted in revenue,
  // the same day's costs "need" ৳3 lakh of bikes or ৳40,000 of parts — a
  // number that moves with what happened to sell last, not with what is owed.
  const dailyNeed = target.daily_profit_needed;
  const earned = today.sales.gross_profit;
  const progress = dailyNeed > 0 ? (earned / dailyNeed) * 100 : 0;
  const shortfall = Math.max(0, dailyNeed - earned);

  return (
    <div className="page space-y-4">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            স্বাগতম{user?.first_name ? `, ${user.first_name}` : ""}
          </h1>
          <p className="page-sub">{dateLine}</p>
        </div>
        <button onClick={load} className="btn btn-ghost" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {feed?.coach?.length ? <CoachStrip messages={feed.coach} /> : null}

      {/* ── what the shop costs to run ───────────────────────────── */}
      <div className="plane">
        <div className="plane-section">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="section-title mb-0">ব্যবসা চালাতে মাসে কত লাগে</span>
            <span className="text-xs text-slate-500">
              স্টক কেনার টাকা এর বাইরে
            </span>
          </div>

          {/* The itemised version of the same money — who got paid what, and
              when — for handing to an accountant or checking against a bank
              statement. */}
          <div className="mt-1">
            <MonthlyExpenseButton />
          </div>

          <div className="mt-2 grid gap-2 grid-cols-2 lg:auto-cols-fr lg:grid-flow-col">
            {(
              [
                [
                  "কর্মচারীর বেতন",
                  commitment.payroll,
                  `${commitment.employees} জন`,
                  "/dashboard/employees",
                ],
                [
                  "অফিস ম্যানেজমেন্ট",
                  commitment.fixed,
                  `${month.fixed_costs.count} টা`,
                  "/dashboard/employees/office-rent",
                ],
                [
                  "লোনের কিস্তি",
                  commitment.loan,
                  `${month.loans.active_count} টা লোন`,
                  "/dashboard/banking/loans",
                ],
              ] as [string, number, string, string][]
            ).map(([label, amount, note, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="stat-label">{label}</div>
                <div className="stat-value num">{money(amount)}</div>
                <div className="stat-meta">{note}</div>
              </Link>
            ))}

            <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5">
              <div className="stat-label">সব মিলিয়ে</div>
              <div className="stat-value num text-cyan-800">
                {money(commitment.total)}
              </div>
              <div className="stat-meta">
                {month.period?.closed_label ? "খোলার দিনে " : "দিনে "}
                {money(commitment.daily)}
              </div>
            </div>
          </div>
        </div>

        {/* ── today against the target ───────────────────────────── */}
        <div className="plane-section">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="section-title mb-0">আজকের বিক্রি ও টার্গেট</span>
            <Link
              href="/dashboard/analytics"
              className="text-xs font-medium text-cyan-700 hover:underline"
            >
              পুরো অ্যানালিটিক্স
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="num text-2xl font-semibold text-slate-900">
              {money(earned)}
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                লাভ
              </span>
            </span>
            <span className="text-sm text-slate-600">
              টার্গেট {money(dailyNeed)} লাভ
            </span>
          </div>

          {/* A bar, not a chart: one number against one line. */}
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                progress >= 100 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs">
            {progress >= 100 ? (
              <span className="money-pos font-medium">
                টার্গেট পেরিয়ে গেছে — আজ {today.sales.orders_count} টা অর্ডার
              </span>
            ) : (
              <span className="text-slate-600">
                আরও <span className="money-neg font-medium">{money(shortfall)}</span>{" "}
                লাভ হলেই আজকের খরচ উঠে যাবে · এখন পর্যন্ত{" "}
                {today.sales.orders_count} টা অর্ডার
              </span>
            )}
          </p>

          {/* What that profit means in things to go and sell. "or", not
              "and" — either one on its own clears the day. */}
          {!toDo.covered && toDo.lines.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">যেভাবে উঠবে:</span>
              {toDo.lines.map((line, index) => (
                <span key={line.key} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-xs text-slate-400">বা</span>
                  )}
                  <span
                    className="inline-flex items-baseline gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs text-cyan-800"
                    title={line.note}
                  >
                    <span className="num font-semibold">{line.units}</span>
                    টা {line.label}
                  </span>
                </span>
              ))}
              <span className="text-[11px] text-slate-400">
                (আপনার নিজের গড় লাভ ধরে)
              </span>
            </div>
          )}

          <div className="stat-strip mt-3 rounded-lg border border-slate-200">
            <div className="stat">
              <div className="stat-label">আজকের লাভ</div>
              <div className="stat-value num money-pos">
                {money(today.sales.gross_profit)}
              </div>
              <div className="stat-meta">খরচ বাদ দেওয়ার আগে</div>
            </div>
            {/* The amortised figure, not the day's cash. A month's rent
                leaving the bank today is not today's cost — it buys the whole
                month — and charging it here made one day look catastrophic
                while the days either side looked free. */}
            <div className="stat">
              <div className="stat-label">আজকের খরচ</div>
              <div className="stat-value num money-neg">
                {money(today.costs.total)}
              </div>
              <div className="stat-meta">
                {today.costs.monthly_share_daily > 0
                  ? `মাসিক খরচের আজকের ভাগ ${money(
                      today.costs.monthly_share_daily
                    )}`
                  : today.costs.by_category[0]
                  ? `সবচেয়ে বেশি ${today.costs.by_category[0].label}`
                  : "কোনো খরচ ওঠেনি"}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">আজ থাকল</div>
              <div
                className={`stat-value num ${
                  today.net.is_profit ? "money-pos" : "money-neg"
                }`}
              >
                {money(Math.abs(today.net.profit))}
              </div>
              <div className="stat-meta">
                {today.net.is_profit ? "লাভ" : "ঘাটতি"}
                {Math.abs(today.costs.cash_out - today.costs.total) > 1 &&
                  ` · আজ ব্যাংক থেকে গেছে ${money(today.costs.cash_out)}`}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">বাকি পাওনা</div>
              <div className="stat-value num money-neg">
                {money(today.receivables.total)}
              </div>
              <div className="stat-meta">
                {today.receivables.customers_count} জনের কাছে
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── stock on the shelf ─────────────────────────────────────── */}
      {feed && (
        <div className="plane">
          <div className="plane-section">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="section-title mb-0">স্টকে কত টাকা আটকে আছে</span>
              <Link
                href="/dashboard/products"
                className="text-xs font-medium text-cyan-700 hover:underline"
              >
                প্রোডাক্ট দেখুন
              </Link>
            </div>
          </div>
          <div className="stat-strip">
            <div className="stat">
              <div className="stat-label">কেনা দাম</div>
              <div className="stat-value num">
                {money(feed.inventory.buy_value)}
              </div>
              <div className="stat-meta">
                {feed.inventory.product_count.toLocaleString("bn-BD-u-nu-latn")} টা আইটেম
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">বেচা দাম</div>
              <div className="stat-value num">
                {money(feed.inventory.sell_value)}
              </div>
              <div className="stat-meta">
                {feed.inventory.units.toLocaleString("bn-BD-u-nu-latn")} পিস স্টকে
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">সব বিক্রি হলে লাভ</div>
              <div className="stat-value num money-pos">
                {money(feed.inventory.potential_profit)}
              </div>
              <div className="stat-meta">
                মার্জিন {feed.inventory.margin_pct.toLocaleString("bn-BD-u-nu-latn")}%
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">সামনে যে খরচ আসছে</div>
              <div className="stat-value num money-neg">
                {money(
                  feed.upcoming_costs.reduce((sum, row) => sum + row.amount, 0)
                )}
              </div>
              <div className="stat-meta">
                {feed.upcoming_costs[0]
                  ? `${feed.upcoming_costs[0].title} ${daysAway(
                      feed.upcoming_costs[0].days_left
                    )}`
                  : "কিছু বাকি নেই"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── the short reports ──────────────────────────────────────
          Three columns on a wide screen, one on a phone. Each card is
          self-contained, so a module with no data yet simply says so instead
          of leaving a hole in the grid. */}
      {feed && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ReportCard
            title="সামনে যেসব খরচ আসছে"
            icon={CalendarClock}
            href="/dashboard/employees/office-rent"
            hrefLabel="খরচ"
            meta="ভাড়া, বিল, কিস্তি — কবে কোনটা"
            empty="সামনে কোনো নির্দিষ্ট খরচ নেই।"
            isEmpty={feed.upcoming_costs.length === 0}
          >
            {feed.upcoming_costs.map((row) => (
              <ReportRow
                key={row.id}
                href={row.href}
                title={row.title}
                note={`${shortDate(row.due_date)}${
                  row.paid_this_month ? " · এই মাসের দেওয়া হয়েছে" : ""
                }`}
                value={money(row.amount)}
                valueNote={daysAway(row.days_left)}
                tone={row.days_left < 0 ? "neg" : row.days_left <= 7 ? "warn" : undefined}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="কোন মাল আরও আনতে হবে"
            icon={PackagePlus}
            href="/dashboard/products"
            hrefLabel="প্রোডাক্ট"
            meta="যেগুলো দ্রুত ফুরিয়ে যাচ্ছে"
            empty="এখন আলাদা করে কিছু আনার দরকার নেই — যা বিক্রি হচ্ছে তার স্টক যথেষ্ট আছে।"
            isEmpty={!feed.restock?.length}
          >
            {(feed.restock ?? []).map((row) => (
              <ReportRow
                key={row.id}
                href={`/dashboard/products/${row.id}`}
                title={row.name}
                note={row.note}
                value={`${row.suggest_qty.toLocaleString("bn-BD-u-nu-latn")} পিস`}
                valueNote={`≈ ${money(row.buy_cost)}`}
                tone={row.days_left <= 7 ? "neg" : "warn"}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="শেষ 5টা বিক্রি"
            icon={ShoppingCart}
            href="/dashboard/orders"
            meta="কাকে, কত টাকার"
            empty="এখনো কোনো বিক্রি হয়নি।"
            isEmpty={feed.recent_sales.length === 0}
          >
            {feed.recent_sales.map((row) => (
              <ReportRow
                key={row.id}
                href={`/dashboard/orders/edit/${row.id}`}
                title={row.customer}
                note={`${row.order_number} · ${shortDate(row.at)}`}
                value={money(row.total)}
                valueNote={row.due > 0 ? `বাকি ${money(row.due)}` : "পুরো পরিশোধ"}
                tone={row.due > 0 ? "warn" : "pos"}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="শেষ 5টা এসএমএস"
            icon={MessageSquare}
            href="/dashboard/sms"
            hrefLabel="এসএমএস"
            meta="কাকে পাঠানো হয়েছে"
            empty="এখনো কোনো এসএমএস যায়নি।"
            isEmpty={feed.recent_sms.length === 0}
          >
            {feed.recent_sms.map((row) => (
              <ReportRow
                key={row.id}
                title={row.customer}
                note={row.preview || row.phone}
                value={SMS_STATUS[row.status] ?? row.status}
                valueNote={shortDate(row.at)}
                tone={row.status === "failed" ? "neg" : "pos"}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="মোটর বাইকের শেষ কাজ"
            icon={Bike}
            href="/dashboard/vehicles"
            hrefLabel="বাইক"
            meta="স্টকে ঢোকা আর বিক্রি"
            empty="এখনো কোনো বাইক যোগ হয়নি।"
            isEmpty={feed.recent_vehicles.length === 0}
          >
            {feed.recent_vehicles.map((row) => (
              <ReportRow
                key={row.id}
                href={`/dashboard/vehicles/${row.id}`}
                title={row.name}
                note={`${row.identifier}${row.customer ? ` · ${row.customer}` : ""}`}
                value={money(row.amount)}
                valueNote={VEHICLE_STATUS[row.status] ?? row.status}
                tone={row.status === "sold" ? "pos" : undefined}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="নোটবুকের শেষ লেখা"
            icon={NotebookPen}
            href="/dashboard/notebook"
            hrefLabel="নোটবুক"
            meta="যা মনে রাখতে লিখেছেন"
            empty="এখনো কোনো নোট লেখা হয়নি।"
            isEmpty={feed.recent_notes.length === 0}
          >
            {feed.recent_notes.map((row) => (
              <ReportRow
                key={row.id}
                href={`/dashboard/notebook/${row.notebook_id}`}
                title={row.title}
                note={row.preview || row.notebook}
                value={shortDate(row.at)}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="কোথায় নজর দিতে হবে"
            icon={AlertTriangle}
            href="/dashboard/analytics"
            hrefLabel="অ্যানালিটিক্স"
            meta="আজকের হিসাব থেকে"
            empty="এখন আলাদা করে দেখার কিছু নেই।"
            isEmpty={!today.focus?.length}
          >
            {(today.focus ?? []).slice(0, 5).map((item, index) => (
              <ReportRow
                key={`${item.title}-${index}`}
                href="/dashboard/analytics"
                title={item.title}
                note={item.detail}
                /* The action sentence is too long for the right column, so the
                   row carries how urgent it is and the full advice stays on
                   the analytics page. */
                value={SEVERITY_WORD[item.severity]}
                tone={
                  item.severity === "danger"
                    ? "neg"
                    : item.severity === "good"
                    ? "pos"
                    : "warn"
                }
              />
            ))}
          </ReportCard>

          <ReportCard
            title="শেষ 5টা ব্যাংক লেনদেন"
            icon={CreditCard}
            href="/dashboard/banking"
            hrefLabel="ব্যাংকিং"
            meta="জমা আর উত্তোলন"
            empty="এখনো কোনো লেনদেন হয়নি।"
            isEmpty={feed.recent_banking.length === 0}
          >
            {feed.recent_banking.map((row) => (
              <ReportRow
                key={row.id}
                href="/dashboard/banking"
                title={row.purpose || row.account}
                note={`${row.account} · ${shortDate(row.at)}`}
                value={`${row.type === "credit" ? "+" : "−"}${money(row.amount)}`}
                tone={row.type === "credit" ? "pos" : "neg"}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="শেষ 5 জন কাস্টমার"
            icon={Users}
            href="/dashboard/customers"
            hrefLabel="কাস্টমার"
            meta="নতুন যারা যুক্ত হয়েছে"
            empty="এখনো কোনো কাস্টমার যোগ হয়নি।"
            isEmpty={feed.recent_customers.length === 0}
          >
            {feed.recent_customers.map((row) => (
              <ReportRow
                key={row.id}
                href={`/dashboard/customers/${row.id}`}
                title={row.name}
                note={row.phone || "ফোন নেই"}
                value={shortDate(row.at)}
              />
            ))}
          </ReportCard>

          <ReportCard
            title="সাপ্লায়ারের শেষ কাজ"
            icon={Truck}
            href="/dashboard/suppliers"
            hrefLabel="সাপ্লায়ার"
            meta="কেনা আর পেমেন্ট"
            empty="এখনো কোনো কেনাকাটা হয়নি।"
            isEmpty={feed.recent_suppliers.length === 0}
          >
            {feed.recent_suppliers.map((row) => (
              <ReportRow
                key={row.id}
                href={`/dashboard/suppliers/${row.supplier_id}`}
                title={row.supplier}
                note={`${row.kind === "purchase" ? "কেনা" : "পেমেন্ট"} · ${
                  row.note || shortDate(row.at)
                }`}
                value={money(row.amount)}
                valueNote={shortDate(row.at)}
                tone={row.kind === "purchase" ? "neg" : undefined}
              />
            ))}
          </ReportCard>
        </div>
      )}

      {/* Stock value is the one figure the shelf cannot show on its own. */}
      {feed && feed.inventory.units === 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Package className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          স্টকে কিছু নেই — প্রোডাক্ট যোগ করলে এখানে কেনা-বেচা দাম আর সম্ভাব্য লাভ
          দেখা যাবে।
        </p>
      )}
    </div>
  );
}
