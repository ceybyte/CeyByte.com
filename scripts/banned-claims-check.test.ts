/// <reference types="bun-types" />
import { describe, it, expect } from "bun:test";
import { scanTextForBannedClaims, type ClaimViolation } from "./banned-claims-check";

describe("Banned Claims Scanner (CLAUDE.md §8.1)", () => {
  it("detects banned marketing claims", () => {
    const text = "Our software offers 100% offline billing with seamless cloud sync and is IRD compliant.";
    const violations = scanTextForBannedClaims(text);
    expect(violations.length).toBeGreaterThanOrEqual(3);
    expect(violations.some((v: ClaimViolation) => v.rule.includes("100% offline"))).toBe(true);
    expect(violations.some((v: ClaimViolation) => v.rule.includes("Cloud sync"))).toBe(true);
    expect(violations.some((v: ClaimViolation) => v.rule.includes("IRD compliant"))).toBe(true);
    expect(violations.some((v: ClaimViolation) => v.rule.includes("seamless"))).toBe(true);
  });

  it("detects prohibited brand spelling like CB-POS or CBPOS", () => {
    const text = "Download CB-POS today or CBPOS for Windows.";
    const violations = scanTextForBannedClaims(text);
    expect(violations.some((v: ClaimViolation) => v.rule.includes("CB-POS"))).toBe(true);
    expect(violations.some((v: ClaimViolation) => v.rule.includes("CBPOS"))).toBe(true);
  });

  it("passes clean factual copy citing CBPOS facts", () => {
    const text =
      "CB\u00A0POS stores sales in a local SQLite file. [G1] Backups require a master password. [G2]";
    const violations = scanTextForBannedClaims(text);
    expect(violations.length).toBe(0);
  });
});
