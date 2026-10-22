import { describe, expect, it } from "bun:test";
import { formatLkr, parseLkr } from "./money";
import { formatPhone, normalizePhone, phoneKind, toNationalDigits } from "./phone";
import { haversineKm, isInSriLanka, nearestCity } from "./sri-lanka";
import { divRoundHalfEven, taxFromMrp } from "./tax";

describe("phone", () => {
  it.each([
    ["077 123 4567", "+94771234567"],
    ["0771234567", "+94771234567"],
    ["+94 77 123 4567", "+94771234567"],
    ["0094771234567", "+94771234567"],
    ["94771234567", "+94771234567"],
    ["77-123-4567", "+94771234567"],
    ["011 234 5678", "+94112345678"],
    ["081 222 3344", "+94812223344"],
  ])("normalises %s", (raw, e164) => {
    expect(normalizePhone(raw)).toBe(e164);
  });

  it.each(["", "12345", "079 123 4567", "0771234567890", "+1 415 555 0100", "000 000 0000"])(
    "rejects %s",
    (raw) => {
      expect(normalizePhone(raw)).toBeNull();
    },
  );

  it("tells mobile from landline and can require mobile (WhatsApp)", () => {
    expect(phoneKind(toNationalDigits("0771234567"))).toBe("mobile");
    expect(phoneKind(toNationalDigits("0112345678"))).toBe("landline");
    expect(normalizePhone("011 234 5678", ["mobile"])).toBeNull();
  });

  it("formats E.164 for owner views", () => {
    expect(formatPhone("+94771234567")).toBe("077 123 4567");
  });
});

describe("money", () => {
  it.each([
    [0, "Rs. 0.00"],
    [5, "Rs. 0.05"],
    [125000, "Rs. 1,250.00"],
    [10000, "Rs. 100.00"],
    [123456789, "Rs. 1,234,567.89"],
    [-125050, "-Rs. 1,250.50"],
  ])("formats %d as %s", (cents, text) => {
    expect(formatLkr(cents)).toBe(text);
  });

  it("refuses fractional cents", () => {
    expect(() => formatLkr(1.5)).toThrow(RangeError);
  });

  it.each([
    ["1,250", 125000],
    ["1250.5", 125050],
    ["Rs. 1,250.00", 125000],
    ["rs 100", 10000],
    ["0.05", 5],
  ])("parses %s", (text, cents) => {
    expect(parseLkr(text)).toBe(cents);
  });

  it.each(["", "abc", "1.234", "-5", "1e5"])("rejects %s", (text) => {
    expect(parseLkr(text)).toBeNull();
  });
});

describe("tax display maths [C1] [C2]", () => {
  it("matches the PRD example: MRP 1,180.00 → 1,000.00 / 180.00 / 12.50", () => {
    expect(taxFromMrp(118000)).toEqual({
      mrpCents: 118000,
      baseCents: 100000,
      vatCents: 18000,
      ssclCents: 1250,
    });
  });

  it("keeps base + VAT equal to the MRP", () => {
    for (const mrp of [1, 99, 250, 12345, 99999, 1_000_000]) {
      const t = taxFromMrp(mrp);
      expect(t.baseCents + t.vatCents).toBe(mrp);
    }
  });

  it("rounds ties to even", () => {
    expect(divRoundHalfEven(5, 2)).toBe(2);
    expect(divRoundHalfEven(7, 2)).toBe(4);
    expect(divRoundHalfEven(1, 3)).toBe(0);
    expect(divRoundHalfEven(2, 3)).toBe(1);
    // SSCL on a base of 40 cents is exactly 0.5 cents → 0; on 120 cents it's 1.5 → 2.
    expect(taxFromMrp(0).ssclCents).toBe(0);
    expect(divRoundHalfEven(40, 80)).toBe(0);
    expect(divRoundHalfEven(120, 80)).toBe(2);
  });

  it("works out MRP 250.00", () => {
    // 25000 / 1.18 = 21186.44… → 21186; VAT 3814; SSCL 21186 / 80 = 264.825 → 265
    expect(taxFromMrp(25000)).toEqual({ mrpCents: 25000, baseCents: 21186, vatCents: 3814, ssclCents: 265 });
  });
});

describe("sri-lanka", () => {
  const colombo = { lat: 6.9271, lng: 79.8612 };
  const kandy = { lat: 7.2906, lng: 80.6337 };

  it("checks the bounds", () => {
    expect(isInSriLanka(colombo)).toBe(true);
    expect(isInSriLanka({ lat: 13.08, lng: 80.27 })).toBe(false); // Chennai
  });

  it("measures distance", () => {
    expect(haversineKm(colombo, kandy)).toBeCloseTo(94, 0);
    expect(haversineKm(colombo, colombo)).toBe(0);
  });

  it("finds the nearest city", () => {
    const cities = [
      { name: "Colombo", ...colombo },
      { name: "Kandy", ...kandy },
    ];
    expect(nearestCity({ lat: 6.9, lng: 79.9 }, cities)?.city.name).toBe("Colombo");
    expect(nearestCity(colombo, [])).toBeNull();
  });
});
