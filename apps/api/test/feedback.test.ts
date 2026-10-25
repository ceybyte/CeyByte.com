import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

const call = (
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
) => {
  return exports.default.fetch(`${ORIGIN}${path}`, {
    method: options.method ?? "GET",
    headers: options.headers,
    body: options.body,
    redirect: "manual",
  });
};

describe("Feedback API & Voting (01-PRD §F-07, AC-07.1, AC-07.2)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
        return new Response(JSON.stringify({ success: true }));
      }
      return originalFetch(input, init);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("submits a bug report with sequential public number (CB-0001)", async () => {
    const res = await call("/api/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "CF-Connecting-IP": "203.0.113.1",
        "User-Agent": "Mozilla/5.0 TestBrowser",
      },
      body: JSON.stringify({
        type: "bug",
        title: "Thermal printer cuts off bottom line",
        bodyMd: "When printing long invoices, the last row gets truncated by 5mm.",
        appVersion: "1.4.2",
        windowsVersion: "Windows 10",
        severity: "wrong_output",
        crashLogKey: "crash-logs/draft-1/log.txt",
        contactPrivate: "test-merchant@example.com",
        turnstileToken: "valid-token",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: {
        id: string;
        publicNumber: number;
        formattedNumber: string;
        status: string;
        isPublic: boolean;
      };
    };
    expect(body.ok).toBe(true);
    expect(body.data.publicNumber).toBeGreaterThanOrEqual(1);
    expect(body.data.formattedNumber).toMatch(/^CB-\d{4,}$/);
    expect(body.data.isPublic).toBe(true);
    expect(body.data.status).toBe("open");
  });

  it("assigns sequential public numbers for successive tickets", async () => {
    const res = await call("/api/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "CF-Connecting-IP": "203.0.113.2",
      },
      body: JSON.stringify({
        type: "feature",
        title: "Support dark mode for sales register",
        bodyMd: "We operate a low-light pub and dark mode would prevent glare.",
        turnstileToken: "valid-token",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { publicNumber: number; formattedNumber: string };
    };
    expect(body.ok).toBe(true);
    expect(body.data.publicNumber).toBeGreaterThanOrEqual(2);
  });

  it("strictly hides crashLogKey and contactPrivate from public queries (AC-07.1)", async () => {
    const res = await call("/api/feedback?sort=newest");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      ok: boolean;
      data: {
        items: Array<Record<string, unknown>>;
        total: number;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);

    for (const item of body.data.items) {
      expect(item).not.toHaveProperty("crashLogKey");
      expect(item).not.toHaveProperty("contactPrivate");
      expect(item).not.toHaveProperty("screenshotKey");
      expect(item).toHaveProperty("publicNumber");
      expect(item).toHaveProperty("formattedNumber");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("voteCount");
    }
  });

  it("gets single ticket detail without leaking private fields", async () => {
    // Query list to get first public ticket
    const listRes = await call("/api/feedback");
    const listBody = (await listRes.json()) as {
      data: { items: Array<{ formattedNumber: string; publicNumber: number }> };
    };
    const ticket = listBody.data.items[0];
    expect(ticket).toBeDefined();
    if (!ticket) throw new Error("Ticket not found in test");

    // Query by formatted number e.g. CB-0001
    const res = await call(`/api/feedback/${ticket.formattedNumber}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      ok: boolean;
      data: Record<string, unknown>;
    };
    expect(body.ok).toBe(true);
    expect(body.data.publicNumber).toBe(ticket.publicNumber);
    expect(body.data).not.toHaveProperty("crashLogKey");
    expect(body.data).not.toHaveProperty("contactPrivate");
    expect(body.data).not.toHaveProperty("screenshotKey");
  });

  it("finds similar tickets by title search (FR-07.3)", async () => {
    const res = await call("/api/feedback/similar?q=thermal");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      ok: boolean;
      data: Array<{ formattedNumber: string; title: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]?.title.toLowerCase()).toContain("thermal");
  });

  it("enforces one vote per voter per ticket and prevents double voting (AC-07.2)", async () => {
    const listRes = await call("/api/feedback");
    const listBody = (await listRes.json()) as {
      data: { items: Array<{ formattedNumber: string; voteCount: number }> };
    };
    const ticket = listBody.data.items[0];
    expect(ticket).toBeDefined();
    if (!ticket) throw new Error("Ticket not found in test");
    const initialVotes = ticket.voteCount;

    const voterHeaders = {
      "content-type": "application/json",
      "CF-Connecting-IP": "198.51.100.99",
      "User-Agent": "UniqueVoterAgent/1.0",
    };

    // First vote
    const vote1 = await call(`/api/feedback/${ticket.formattedNumber}/vote`, {
      method: "POST",
      headers: voterHeaders,
      body: JSON.stringify({}),
    });
    expect(vote1.status).toBe(200);
    const vote1Body = (await vote1.json()) as {
      ok: boolean;
      data: { voted: boolean; voteCount: number };
    };
    expect(vote1Body.ok).toBe(true);
    expect(vote1Body.data.voted).toBe(true);
    expect(vote1Body.data.voteCount).toBe(initialVotes + 1);

    // Second vote from EXACT SAME browser/IP
    const vote2 = await call(`/api/feedback/${ticket.formattedNumber}/vote`, {
      method: "POST",
      headers: voterHeaders,
      body: JSON.stringify({}),
    });
    expect(vote2.status).toBe(200);
    const vote2Body = (await vote2.json()) as {
      ok: boolean;
      data: { voted: boolean; alreadyVoted?: boolean; voteCount: number };
    };
    expect(vote2Body.ok).toBe(true);
    expect(vote2Body.data.voted).toBe(false);
    expect(vote2Body.data.alreadyVoted).toBe(true);
    // Crucial check: voteCount MUST NOT have incremented!
    expect(vote2Body.data.voteCount).toBe(initialVotes + 1);
  });
});
