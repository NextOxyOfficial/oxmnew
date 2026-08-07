/** Shapes returned by /api/analytics/overview/ and shared UI helpers. */

export interface Change {
  current: number;
  previous: number;
  change: number;
  /** null when the previous period was zero — "up ∞%" says nothing. */
  change_pct: number | null;
}

export interface FocusSignal {
  severity: "danger" | "warn" | "info" | "good";
  title: string;
  detail: string;
  action: string;
  /** Which drill-down this signal can open; null when there is nothing more. */
  topic: string | null;
}

/** Self-describing table returned by /api/analytics/detail/. */
export interface DetailPayload {
  title: string;
  note: string;
  columns: {
    key: string;
    label: string;
    type?: "money" | "number" | "link";
    tone?: "neg" | "auto";
  }[];
  rows: Record<string, unknown>[];
}

export interface AnalyticsOverview {
  period: {
    preset: string;
    label: string;
    start: string;
    end: string;
    /** Length of the window. */
    days: number;
    /**
     * Trading days in the window — what every per-day figure is divided by.
     * A shop closed on Fridays still owes a full month's rent, so those costs
     * are recovered across the days it is actually open.
     */
    open_days: number;
    closed_days: number[];
    /** "শুক্রবার বন্ধ", or empty when the shop never closes. */
    closed_label: string;
  };
  compare_with: { label: string; start: string; end: string };
  sales: {
    revenue: number;
    cogs: number;
    gross_profit: number;
    orders_count: number;
    avg_order_value: number;
    collected: number;
  };
  costs: {
    expense: number;
    loan: number;
    /** Rent and other fixed monthly bills settled in this period. */
    recurring: number;
    payment: number;
    unclassified: number;
    salaries: number;
    incentives: number;
    total: number;
    by_category: { category: string; label: string; amount: number }[];
  };
  net: { profit: number; is_profit: boolean; margin_pct: number };
  comparison: {
    revenue: Change;
    gross_profit: Change;
    cost: Change;
    net_profit: Change;
    orders: Change;
  };
  targets: {
    daily_cost: number;
    loan_share_daily: number;
    daily_revenue: number;
    breakeven_daily_revenue: number;
    target_daily_revenue: number;
    margin_pct: number;
    gap: number;
    on_track: boolean;
    has_margin: boolean;
    has_costs: boolean;
    /** Trading days the window's costs were spread across. */
    open_days: number;
  };
  receivables: {
    total: number;
    customers_count: number;
    top: {
      customer_id: number | null;
      name: string;
      phone: string | null;
      due: number;
      orders: number;
      oldest: string;
    }[];
  };
  inventory: {
    product_value: number;
    vehicle_value: number;
    vehicle_count: number;
    total: number;
  };
  /** What the shop owes each month before buying any stock. */
  monthly_commitment: {
    payroll: number;
    employees: number;
    loan: number;
    fixed: number;
    total: number;
    /** Per trading day, not per calendar day — see period.open_days. */
    daily: number;
    open_month_days: number;
  };
  fixed_costs: {
    count: number;
    monthly_total: number;
    unpaid_count: number;
    unpaid_amount: number;
    overdue_count: number;
    items: {
      id: number;
      title: string;
      amount: number;
      due_date: string;
      paid_this_month: boolean;
      is_overdue: boolean;
      days_overdue: number;
    }[];
  };
  loans: {
    monthly_due: number;
    outstanding: number;
    overdue_amount: number;
    active_count: number;
    overdue_count: number;
    next: {
      id: number;
      lender: string;
      installment: number;
      due_date: string;
      days_overdue: number;
      is_overdue: boolean;
      remaining_count: number;
      remaining_amount: number;
      progress_pct: number;
    }[];
  };
  dead_stock: { id: number; name: string; stock: number; tied_up: number }[];
  /** Fast movers whose shelf will not last the cover window. */
  restock: {
    id: number;
    name: string;
    sold: number;
    revenue: number;
    per_day: number;
    in_stock: number;
    days_left: number;
    suggest_qty: number;
    buy_cost: number;
    note: string;
  }[];
  focus: FocusSignal[];
  customers_count: number;
}

export const PERIOD_OPTIONS = [
  { value: "today", label: "আজ" },
  { value: "yesterday", label: "গতকাল" },
  { value: "this_week", label: "এই সপ্তাহ" },
  { value: "last_week", label: "গত সপ্তাহ" },
  { value: "this_month", label: "এই মাস" },
  { value: "last_month", label: "গত মাস" },
  { value: "last_7", label: "গত 7 দিন" },
  { value: "last_30", label: "গত 30 দিন" },
  { value: "this_year", label: "এই বছর" },
  { value: "custom", label: "নিজের সময়" },
] as const;

export const SEVERITY_STYLE: Record<
  FocusSignal["severity"],
  { box: string; badge: string; label: string }
> = {
  danger: {
    box: "border-rose-200 bg-rose-50",
    badge: "badge badge-danger",
    label: "জরুরি",
  },
  warn: {
    box: "border-amber-200 bg-amber-50",
    badge: "badge badge-warn",
    label: "খেয়াল করুন",
  },
  info: {
    box: "border-slate-200 bg-slate-50",
    badge: "badge badge-muted",
    label: "জেনে রাখুন",
  },
  good: {
    box: "border-emerald-200 bg-emerald-50",
    badge: "badge badge-success",
    label: "ভালো",
  },
};

/**
 * A rise is not automatically good news — costs going up is bad. `goodWhenUp`
 * lets each row say which direction it wants.
 */
export const changeTone = (change: Change, goodWhenUp = true) => {
  if (change.change === 0) return "text-slate-500";
  const up = change.change > 0;
  return up === goodWhenUp ? "money-pos" : "money-neg";
};

export const changeText = (change: Change) => {
  if (change.change_pct === null) {
    return change.current > 0 ? "নতুন" : "—";
  }
  const sign = change.change_pct > 0 ? "+" : "";
  return `${sign}${change.change_pct.toFixed(1)}%`;
};

/** Days since a date, for "how long has this been owed". */
export const daysSince = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};
