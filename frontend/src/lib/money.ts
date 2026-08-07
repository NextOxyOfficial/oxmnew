/**
 * Money arithmetic helpers.
 *
 * Django REST Framework serialises DecimalField as a *string* ("10000.00").
 * `sum + emp.salary` therefore concatenates instead of adding — ten salaries of
 * 10,000 came out as 10,000 rather than 123,000, because the resulting
 * "010000.0011000.00…" only parses back to its first number. Every total in the
 * app should go through these.
 */

/** Anything the API might send for a number, coerced to one. NaN becomes 0. */
export const num = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Sum one field across a list, tolerating string decimals. */
export function sumBy<T>(
  rows: readonly T[],
  pick: (row: T) => string | number | null | undefined
): number {
  return rows.reduce((total, row) => total + num(pick(row)), 0);
}

/**
 * Profit margin as a percentage of the selling price.
 *
 * Measured against revenue, not cost: "100 টাকা বিক্রিতে কত থাকল" is the figure
 * a shopkeeper prices against, and it is what the analytics break-even maths
 * uses, so both agree.
 */
export const marginPct = (
  sell: string | number | null | undefined,
  buy: string | number | null | undefined
): number => {
  const revenue = num(sell);
  if (revenue <= 0) return 0;
  return ((revenue - num(buy)) / revenue) * 100;
};

export const profitOf = (
  sell: string | number | null | undefined,
  buy: string | number | null | undefined
): number => num(sell) - num(buy);
