// Sri Lankan phone numbers (PRD F-03 gate field, CLAUDE.md §5.3). Stored as E.164: +94 followed by 9 digits.
// Mobile numbers are 7X XXX XXXX (070–078); landlines start with an area code (011 Colombo, 081 Kandy, …).

export type PhoneKind = "mobile" | "landline";

const MOBILE = /^7[0-8]\d{7}$/;
const LANDLINE = /^[1-689]\d{8}$/;

/** Accepts 077 123 4567, 77-123-4567, +94 77 123 4567, 0094771234567, 94771234567. */
export function toNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0094")) digits = digits.slice(4);
  else if (digits.startsWith("94") && digits.length === 11) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function phoneKind(national: string): PhoneKind | null {
  if (MOBILE.test(national)) return "mobile";
  if (LANDLINE.test(national)) return "landline";
  return null;
}

/** Returns +94XXXXXXXXX, or null when the input isn't a Sri Lankan number of an allowed kind. */
export function normalizePhone(
  raw: string,
  allowed: readonly PhoneKind[] = ["mobile", "landline"],
): string | null {
  const national = toNationalDigits(raw);
  const kind = phoneKind(national);
  return kind && allowed.includes(kind) ? `+94${national}` : null;
}

/** +94771234567 → 077 123 4567 (owner and admin views only; never public). */
export function formatPhone(e164: string): string {
  const n = e164.replace(/^\+94/, "");
  return `0${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
}
