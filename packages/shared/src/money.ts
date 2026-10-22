// Money is integer LKR cents (CLAUDE.md §1.9). Display is `Rs. 1,250.00`: Western digits, comma thousands,
// two decimals, a space after "Rs." (06 §5). Floats never touch an amount.

export function formatLkr(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new RangeError(`cents must be a safe integer, got ${cents}`);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const rupees = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}Rs. ${rupees}.${(abs % 100).toString().padStart(2, "0")}`;
}

/** "1,250", "1250.5", "Rs. 1,250.00" → 125000 / 125050 / 125000. Null for anything else. */
export function parseLkr(input: string): number | null {
  const s = input
    .trim()
    .replace(/^rs\.?\s*/i, "")
    .replace(/,/g, "");
  const m = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const [, whole = "0", frac = ""] = m;
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}
