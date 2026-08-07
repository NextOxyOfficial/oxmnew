/** Loan shapes and the Bangla labels every loan screen shares. */

export interface LoanPayment {
  id: number;
  amount: string | number;
  paid_on: string;
  reference: string;
  notes: string | null;
  created_at: string;
}

export interface LoanInstallment {
  /** Set on paid rows so the installment can be undone. */
  payment_id?: number | null;
  number: number;
  due_date: string;
  amount: string | number;
  state: "paid" | "overdue" | "upcoming";
  paid_on: string | null;
  paid_amount: string | number | null;
  reference: string;
  days_late: number;
  /** Days until the due date; null once paid, negative once overdue. */
  days_until: number | null;
  /** Date `days_until` is measured from — the last settled payment. */
  countdown_from?: string | null;
  /** Money receipt for a settled installment, once one is uploaded. */
  receipt_url?: string | null;
}

export const bn = (value: number) => value.toLocaleString("bn-BD-u-nu-latn");

/** Local midnight, so a UTC-parsed ISO date cannot shift the day by one. */
const atMidnight = (value: string | Date) => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Add whole months, clamping to the end of the target month. Plain
 * `setMonth(+1)` on Jan 31 overflows into March, which threw the leftover-day
 * count off by the length of February.
 */
const addMonths = (from: Date, count: number) => {
  const target = new Date(from.getFullYear(), from.getMonth() + count, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(from.getDate(), lastDay));
  return target;
};

/**
 * Split a gap into whole calendar months plus leftover days.
 *
 * Dividing the day count by 30 is what made consecutive installments — all
 * exactly one month apart — read as "7 মাস 5 দিন", "8 মাস 6 দিন", "9 মাস 6 দিন".
 * Month lengths differ, so the remainder crept up every row. Walking the
 * calendar keeps the leftover identical down the whole schedule.
 */
const splitGap = (from: Date, to: Date) => {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  // The day-of-month may not have come round yet, so drop a month if we
  // overshot. Recomputed from `from` rather than stepped back, so clamping
  // stays correct.
  if (addMonths(from, months) > to) months -= 1;
  const marker = addMonths(from, months);
  const days = Math.round((to.getTime() - marker.getTime()) / 86_400_000);
  return { months, days };
};

const gapText = (months: number, days: number, suffix: string) => {
  if (months === 0) return `${bn(days)} দিন ${suffix}`;
  if (days === 0) return `${bn(months)} মাস ${suffix}`;
  return `${bn(months)} মাস ${bn(days)} দিন ${suffix}`;
};

/**
 * "92 দিন" tells a shopkeeper less than "3 মাস 2 দিন" — months are how
 * repayment is actually thought about.
 *
 * `from` is the date the countdown runs from. For an upcoming installment the
 * server sends the last settled payment's date, so the row answers "how long
 * after my last কিস্তি is this one due". Without it this falls back to the raw
 * day count, which is all an overdue row needs.
 */
export const countdownText = (
  days: number | null | undefined,
  from?: string | null,
  to?: string | null
) => {
  if (days === null || days === undefined) return "";
  if (days === 0) return "আজই দিতে হবে";

  const suffix = days < 0 ? "দেরি" : "পর";
  const total = Math.abs(days);

  if (from && to) {
    const start = atMidnight(days < 0 ? to : from);
    const end = atMidnight(days < 0 ? from : to);
    const { months, days: rest } = splitGap(start, end);
    return gapText(months, rest, suffix);
  }

  if (total < 30) return `${bn(total)} দিন ${suffix}`;
  return gapText(Math.floor(total / 30), total % 30, suffix);
};

export interface Loan {
  id: number;
  account: number | null;
  account_name: string | null;
  lender: string;
  purpose: string;
  principal: string | number;
  total_payable: string | number;
  interest_rate: string | number;
  installment_amount: string | number;
  installment_count: number;
  payment_day: number;
  start_date: string;
  status: string;
  notes: string | null;
  paid_amount: string | number;
  remaining_amount: string | number;
  paid_count: number;
  remaining_count: number;
  progress_pct: number;
  next_due_date: string | null;
  is_overdue: boolean;
  days_overdue: number;
  payments?: LoanPayment[];
  schedule?: LoanInstallment[];
  created_at: string;
}

export interface LoanSummary {
  active_count: number;
  monthly_due: string | number;
  outstanding: string | number;
  overdue_count: number;
  overdue_amount: string | number;
  next_due: string | null;
}

export const LOAN_STATUSES = [
  { value: "active", label: "চলছে" },
  { value: "closed", label: "শোধ হয়ে গেছে" },
  { value: "defaulted", label: "খেলাপি" },
] as const;

export const loanStatusLabel = (value?: string | null) =>
  LOAN_STATUSES.find((s) => s.value === value)?.label ?? value ?? "";

export const loanStatusBadge = (loan: Pick<Loan, "status" | "is_overdue">) => {
  if (loan.status === "closed") return "badge badge-muted";
  if (loan.status === "defaulted") return "badge badge-danger";
  return loan.is_overdue ? "badge badge-danger" : "badge badge-success";
};

/**
 * A loan that is running but past its date needs a louder label than its
 * status alone — "চলছে" would hide the fact that a payment was missed.
 */
export const loanStateText = (loan: Pick<Loan, "status" | "is_overdue" | "days_overdue">) => {
  if (loan.status === "closed") return "শোধ হয়ে গেছে";
  if (loan.status === "defaulted") return "খেলাপি";
  return loan.is_overdue ? `${bn(loan.days_overdue)} দিন দেরি` : "চলছে";
};

export const INSTALLMENT_STATE: Record<
  LoanInstallment["state"],
  { label: string; badge: string }
> = {
  paid: { label: "পরিশোধ হয়েছে", badge: "badge badge-success" },
  overdue: { label: "দেরি হয়েছে", badge: "badge badge-danger" },
  upcoming: { label: "আসছে", badge: "badge badge-muted" },
};

/** The first installment still owed — the one the header chip talks about. */
const nextInstallment = (loan: Pick<Loan, "schedule">) =>
  loan.schedule?.find((row) => row.state !== "paid") ?? null;

/**
 * Days until the next installment. Falls back to counting from today when the
 * schedule was not loaded with the loan.
 */
export const nextDueDays = (loan: Pick<Loan, "schedule" | "next_due_date">) => {
  const row = nextInstallment(loan);
  if (row) return row.days_until;
  if (!loan.next_due_date) return null;
  return Math.round(
    (new Date(loan.next_due_date).getTime() - Date.now()) / 86_400_000
  );
};

export const nextDueAnchor = (loan: Pick<Loan, "schedule">) =>
  nextInstallment(loan)?.countdown_from ?? null;

export const toNumber = (value: string | number | null | undefined) =>
  value === null || value === undefined ? 0 : Number(value) || 0;

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("bn-BD-u-nu-latn") : "—";
