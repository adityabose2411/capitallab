// Indian number formatting helpers. All monetary values are ₹ crore.
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const NM = "Not meaningful";

export function isNum(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function cr(v: number | null | undefined, decimals = 0): string {
  if (!isNum(v)) return NM;
  const f = decimals ? inr2 : inr;
  return `₹${f.format(v)} cr`;
}
export function num(v: number | null | undefined, decimals = 0): string {
  if (!isNum(v)) return NM;
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
}
export function x(v: number | null | undefined, d = 2): string {
  return isNum(v) ? `${v.toFixed(d)}×` : NM;
}
export function pct(v: number | null | undefined, d = 1): string {
  return isNum(v) ? `${(v * 100).toFixed(d)}%` : NM;
}
/** Safe ratio: returns null when denominator is zero/negative (if required) or inputs missing. */
export function ratio(n: number | null | undefined, d: number | null | undefined, requirePositiveDen = true): number | null {
  if (!isNum(n) || !isNum(d)) return null;
  if (d === 0 || (requirePositiveDen && d < 0)) return null;
  return n / d;
}
