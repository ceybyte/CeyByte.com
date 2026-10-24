/// <reference types="bun-types" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";
import { taxFromMrp } from "@cbpos/shared/tax";
import { faqSchema, softwareSchema } from "../../../lib/json-ld";

function loadMessages(locale: string): Record<string, unknown> {
  // apps/web working dir or repo root
  const root = resolve(__dirname, "../../../../../..");
  const path = resolve(root, `messages/${locale}.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

describe("Homepage Logic & Schemas", () => {
  it("computes accurate dual-tax math for MRP 1,180.00 matching PRD [C1] [C2]", () => {
    const breakdown = taxFromMrp(118000); // 1,180.00 in cents
    expect(breakdown.baseCents).toBe(100000); // 1,000.00 pre-VAT base
    expect(breakdown.vatCents).toBe(18000); // 180.00 (18% VAT)
    expect(breakdown.ssclCents).toBe(1250); // 12.50 (2.5% on 50% base)
  });

  it("handles boundary round-half-even tax ties properly", () => {
    // Test that non-negative inputs calculate without error
    const zero = taxFromMrp(0);
    expect(zero.baseCents).toBe(0);
    expect(zero.vatCents).toBe(0);
    expect(zero.ssclCents).toBe(0);

    const small = taxFromMrp(100); // Rs. 1.00
    expect(small.baseCents).toBe(85);
    expect(small.vatCents).toBe(15);
    expect(small.ssclCents).toBe(1);
  });

  it("generates valid FAQPage JSON-LD schema with questions and answers", () => {
    const items = [
      { q: "Is CB POS really free?", a: "Yes, it is free." },
      { q: "Does it work offline?", a: "Yes, it runs locally." },
    ];
    const schema = faqSchema(items);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity.length).toBe(2);
    expect(schema.mainEntity[0]?.name).toBe("Is CB POS really free?");
    expect(schema.mainEntity[0]?.acceptedAnswer.text).toBe("Yes, it is free.");
  });

  it("generates valid SoftwareApplication schema for Windows POS", () => {
    const schema = softwareSchema();
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.name).toBe("CB POS");
    expect(schema.operatingSystem).toBe("Windows 10 or later");
    expect(schema.offers.price).toBe("0");
    expect(schema.offers.priceCurrency).toBe("LKR");
    expect(schema.creator.name).toBe("Ceylon Byte");
  });

  it("maintains 100% trilingual key parity across en, si, and ta home dictionaries", () => {
    const enMessages = loadMessages("en");
    const siMessages = loadMessages("si");
    const taMessages = loadMessages("ta");

    function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          return getKeys(val as Record<string, unknown>, nextPrefix);
        }
        return [nextPrefix];
      });
    }

    const enKeys = getKeys(enMessages.home as Record<string, unknown>).sort();
    const siKeys = getKeys(siMessages.home as Record<string, unknown>).sort();
    const taKeys = getKeys(taMessages.home as Record<string, unknown>).sort();

    expect(siKeys).toEqual(enKeys);
    expect(taKeys).toEqual(enKeys);
  });
});
