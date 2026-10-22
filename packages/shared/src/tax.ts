// Display maths for the homepage tax card, mirroring CB POS [C1] [C2] (PRD FR-02.5):
//   base = mrp / 1.18, vat = mrp − base, sscl = base × 0.50 × 0.025
// each rounded to 2 dp half-even, as the app does. The customer pays the MRP; VAT and SSCL are backed out of it.
// Computed in exact integer cents, so ties are real ties rather than float artefacts.
// CB POS calculates these; the IRD hasn't certified it (CLAUDE.md §1.3a).

export const VAT_RATE_PERCENT = 18;
export const SSCL_RATE_PERCENT = 2.5;
/** SSCL applies to 50% of the pre-VAT price for retail. */
export const SSCL_BASE_SHARE = 0.5;

/** Round n / d to the nearest integer, ties to even. Both must be non-negative integers, d > 0. */
export function divRoundHalfEven(n: number, d: number): number {
  const q = Math.floor(n / d);
  const r = n - q * d;
  if (r * 2 < d) return q;
  if (r * 2 > d) return q + 1;
  return q % 2 === 0 ? q : q + 1;
}

export type TaxBreakdown = { mrpCents: number; baseCents: number; vatCents: number; ssclCents: number };

export function taxFromMrp(mrpCents: number): TaxBreakdown {
  if (!Number.isSafeInteger(mrpCents) || mrpCents < 0) {
    throw new RangeError(`mrpCents must be a non-negative integer, got ${mrpCents}`);
  }
  const baseCents = divRoundHalfEven(mrpCents * 100, 100 + VAT_RATE_PERCENT);
  // base × 0.5 × 0.025 = base × 1 / 80
  const ssclCents = divRoundHalfEven(baseCents, 80);
  return { mrpCents, baseCents, vatCents: mrpCents - baseCents, ssclCents };
}
