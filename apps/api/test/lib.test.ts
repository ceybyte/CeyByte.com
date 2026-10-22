import { describe, expect, it } from "vitest";
import { redactContact } from "../src/lib/audit";
import { hmacSha256Hex } from "../src/lib/crypto";
import { verifyWebhookSignature } from "../src/lib/github";
import { ipHash } from "../src/lib/iphash";
import { redact } from "../src/lib/log";
import { checkDeclaredFile, matchesMagic } from "../src/lib/r2";

describe("log redaction", () => {
  it("drops personal keys at any depth", () => {
    const out = JSON.stringify(
      redact({
        route: "/api/downloads",
        merchant: { phone: "+94771234567", fullName: "Nimal", shopName: "Perera Stores", whatsapp: "x" },
        email: "a@b.c",
        clientIp: "203.0.113.7",
        contactPrivate: "077",
      }),
    );
    expect(out).toContain("Perera Stores");
    for (const leaked of ["+9477", "Nimal", "a@b.c", "203.0.113.7", "077"]) expect(out).not.toContain(leaked);
  });
});

describe("audit redaction", () => {
  it("replaces contact values but keeps the key", () => {
    expect(redactContact({ phone: "+94771234567", status: "listed", nested: { full_name: "N" } })).toEqual({
      phone: "[redacted]",
      status: "listed",
      nested: { full_name: "[redacted]" },
    });
  });
});

describe("ip hash", () => {
  it("is stable within a day and changes the next day", async () => {
    const env = { IP_HASH_PEPPER: "p" };
    const day1 = new Date("2026-10-22T10:00:00Z");
    const a = await ipHash(env, "203.0.113.7", day1);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(await ipHash(env, "203.0.113.7", new Date("2026-10-22T23:59:00Z"))).toBe(a);
    expect(await ipHash(env, "203.0.113.7", new Date("2026-10-23T00:00:00Z"))).not.toBe(a);
  });
});

describe("uploads", () => {
  it("checks magic bytes", () => {
    expect(matchesMagic("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(matchesMagic("image/png", new Uint8Array([0xff, 0xd8, 0xff]))).toBe(false);
    expect(matchesMagic("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(matchesMagic("text/plain", new TextEncoder().encode("2026-10-"))).toBe(true);
    expect(matchesMagic("text/plain", new Uint8Array([0x4d, 0x5a, 0x00, 0x01]))).toBe(false);
    expect(matchesMagic("image/gif", new Uint8Array([0x47]))).toBe(false);
  });

  it("rejects declared files that are too big or the wrong type", () => {
    expect(checkDeclaredFile("crash_log", "cbpos_logs.txt", "text/plain", 1024)).toBe("txt");
    expect(() => checkDeclaredFile("crash_log", "a.txt", "text/plain", 6 * 1024 * 1024)).toThrow(
      "FILE_TOO_LARGE",
    );
    expect(() => checkDeclaredFile("donation_slip", "a.exe", "image/png", 10)).toThrow(
      "FILE_TYPE_NOT_ALLOWED",
    );
    expect(() => checkDeclaredFile("ticket_screenshot", "a.pdf", "application/pdf", 10)).toThrow(
      "FILE_TYPE_NOT_ALLOWED",
    );
  });
});

describe("github webhook signature", () => {
  it("accepts the right HMAC and rejects anything else", async () => {
    const body = new TextEncoder().encode('{"action":"published"}').buffer as ArrayBuffer;
    const good = `sha256=${await hmacSha256Hex("s3cret", body)}`;
    expect(await verifyWebhookSignature("s3cret", body, good)).toBe(true);
    expect(await verifyWebhookSignature("other", body, good)).toBe(false);
    expect(await verifyWebhookSignature("s3cret", body, null)).toBe(false);
    expect(await verifyWebhookSignature("", body, good)).toBe(false);
  });
});
