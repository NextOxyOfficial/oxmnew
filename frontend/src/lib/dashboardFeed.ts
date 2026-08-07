/** Shapes returned by /analytics/feed/ — the dashboard's short reports. */

export interface InventoryValue {
  buy_value: number;
  sell_value: number;
  potential_profit: number;
  margin_pct: number;
  units: number;
  product_count: number;
}

export interface FeedSale {
  id: number;
  order_number: string;
  customer: string;
  total: number;
  due: number;
  at: string;
}

export interface FeedSms {
  id: number;
  customer: string;
  phone: string;
  status: string;
  preview: string;
  at: string;
}

export interface FeedBanking {
  id: number;
  account: string;
  type: "credit" | "debit";
  nature: string;
  amount: number;
  purpose: string;
  at: string;
}

export interface FeedCustomer {
  id: number;
  name: string;
  phone: string | null;
  at: string;
}

export interface FeedSupplier {
  id: string;
  kind: "purchase" | "payment";
  supplier: string;
  supplier_id: number;
  amount: number;
  note: string;
  at: string;
}

export interface FeedVehicle {
  id: number;
  name: string;
  identifier: string;
  status: string;
  customer: string | null;
  amount: number;
  at: string;
}

export interface FeedNote {
  id: number;
  notebook_id: number;
  notebook: string;
  title: string;
  preview: string;
  at: string;
}

export interface UpcomingCost {
  id: string;
  kind: "fixed" | "loan";
  title: string;
  category: string;
  amount: number;
  due_date: string;
  days_left: number;
  paid_this_month: boolean;
  href: string;
}

export interface CoachMessage {
  tone: "danger" | "warn" | "good" | "info";
  emoji: string;
  title: string;
  detail: string;
}

export interface RestockRow {
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
}

export interface DashboardFeed {
  coach: CoachMessage[];
  restock: RestockRow[];
  inventory: InventoryValue;
  recent_sales: FeedSale[];
  recent_sms: FeedSms[];
  recent_banking: FeedBanking[];
  recent_customers: FeedCustomer[];
  recent_suppliers: FeedSupplier[];
  recent_vehicles: FeedVehicle[];
  recent_notes: FeedNote[];
  upcoming_costs: UpcomingCost[];
}

/**
 * "7 আগস্ট" — the month spelled out.
 *
 * The abbreviated form gave "1 সেপ", which is not a word anyone reads: Bangla
 * month names are not routinely shortened the way English ones are.
 */
export const shortDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("bn-BD-u-nu-latn", {
        day: "numeric",
        month: "long",
      })
    : "—";

/**
 * How far off something is, in words.
 *
 * A raw date makes the reader do the subtraction; "3 দিন পর" is the thing they
 * actually wanted to know.
 */
export const daysAway = (days: number) => {
  const n = Math.abs(days).toLocaleString("bn-BD-u-nu-latn");
  if (days < 0) return `${n} দিন পেরিয়ে গেছে`;
  if (days === 0) return "আজই";
  if (days === 1) return "কালই";
  return `${n} দিন পর`;
};

export const VEHICLE_STATUS: Record<string, string> = {
  in_stock: "স্টকে",
  reserved: "বুকিং",
  sold: "বিক্রি",
};

export const SMS_STATUS: Record<string, string> = {
  sent: "গেছে",
  pending: "যাচ্ছে",
  failed: "যায়নি",
};
