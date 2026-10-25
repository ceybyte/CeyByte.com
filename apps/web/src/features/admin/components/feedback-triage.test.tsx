import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { FeedbackTriage } from "./feedback-triage";

// Mock next/navigation
mock.module("next/navigation", () => ({
  usePathname: () => "/admin/feedback",
  useRouter: () => ({ push: () => {} }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// Mock fetchAdminFeedback
mock.module("../api", () => ({
  fetchAdminFeedback: async () => ({
    items: [
      {
        id: "fb-1",
        publicNumber: 142,
        formattedNumber: "CB-0142",
        type: "bug",
        title: "Printer receipt cut off",
        bodyMd: "Receipt truncated during end of day report.",
        status: "open",
        severity: "wrong_output",
        voteCount: 5,
        isPublic: true,
        crashLogKey: "crash-logs/1/cbpos_logs.txt",
        crashLogUrl: "http://example.com/log.txt",
        contactPrivate: "merchant@example.com",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
  }),
  updateAdminFeedback: async () => ({}),
}));

describe("FeedbackTriage Component (S14, F-08)", () => {
  test("renders Feedback Triage interface header and controls", () => {
    const html = renderToString(<FeedbackTriage />);
    expect(html).toContain("Feedback Triage (F-08)");
    expect(html).toContain("All Types");
    expect(html).toContain("All Statuses");
    expect(html).toContain("Refresh");
  });
});
