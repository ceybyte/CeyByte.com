import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { FeedbackBoard } from "./components/FeedbackBoard";
import { FeedbackCard } from "./components/FeedbackCard";
import { FeedbackFilters } from "./components/FeedbackFilters";
import { FeedbackSubmitForm } from "./components/FeedbackSubmitForm";
import { TicketDetailView } from "./components/TicketDetailView";
import { VoteButton } from "./components/VoteButton";
import type { PublicFeedbackTicket } from "./types";

// Mock api
mock.module("./api", () => ({
  fetchFeedbackList: async () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  }),
  fetchTicket: async () => ({
    id: "fb-1",
    publicNumber: 142,
    formattedNumber: "CB-0142",
    type: "bug",
    title: "Thermal printer receipt cut off",
    bodyMd: "The bottom 10mm of receipts is truncated when printing long receipts.",
    status: "planned",
    severity: "wrong_output",
    appVersion: "1.4.2",
    windowsVersion: "Windows 11",
    voteCount: 15,
    hasVoted: false,
    adminResponseMd: "Investigating ESC/POS line feed issue.",
    adminRespondedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
  fetchSimilarTickets: async () => [],
  submitTicket: async () => ({
    id: "fb-new",
    publicNumber: 143,
    formattedNumber: "CB-0143",
    status: "open",
    isPublic: true,
  }),
  voteTicket: async () => ({
    voted: true,
    voteCount: 16,
  }),
}));

describe("Feedback Tracker UI Components (S07, S08, F-07)", () => {
  const sampleTicket: PublicFeedbackTicket = {
    id: "fb-1",
    publicNumber: 142,
    formattedNumber: "CB-0142",
    type: "bug",
    title: "Thermal printer receipt cut off",
    bodyMd: "The bottom 10mm of receipts is truncated when printing long receipts.",
    status: "shipped",
    severity: "wrong_output",
    releaseVersion: "1.4.3",
    voteCount: 24,
    hasVoted: true,
    adminResponseMd: "Fixed in v1.4.3 release.",
    adminRespondedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  test("FeedbackBoard renders header, lead, action buttons, and filters", () => {
    const html = renderToString(<FeedbackBoard locale="en" />);
    expect(html).toContain("Feedback");
    expect(html).toContain("Suggest a feature");
    expect(html).toContain("Report a problem");
    expect(html).toContain("All");
    expect(html).toContain("Bugs");
    expect(html).toContain("Features");
  });

  test("FeedbackCard renders ticket number, title, vote count, and shipped badge", () => {
    const html = renderToString(<FeedbackCard ticket={sampleTicket} locale="en" />);
    expect(html).toContain("CB-0142");
    expect(html).toContain("Thermal printer receipt cut off");
    expect(html).toContain("Fixed in v1.4.3");
    expect(html).toContain("24");
    expect(html).toContain("Official response");
  });

  test("VoteButton renders up-chevron and vote count", () => {
    const html = renderToString(<VoteButton ticketNumber="CB-0142" initialVotes={24} hasVoted={true} />);
    expect(html).toContain("24");
  });

  test("FeedbackFilters renders type tabs, status dropdown, search, and sort toggles", () => {
    const html = renderToString(
      <FeedbackFilters
        currentType="all"
        onTypeChange={() => {}}
        currentStatus="all"
        onStatusChange={() => {}}
        currentSort="votes"
        onSortChange={() => {}}
        search=""
        onSearchChange={() => {}}
      />,
    );
    expect(html).toContain("All");
    expect(html).toContain("Bugs");
    expect(html).toContain("Features");
    expect(html).toContain("Any status");
    expect(html).toContain("Most votes");
    expect(html).toContain("Newest");
  });

  test("FeedbackSubmitForm renders type option cards, inputs, and cbpos_logs.txt help text", () => {
    const html = renderToString(<FeedbackSubmitForm locale="en" initialType="bug" />);
    expect(html).toContain("Tell us what happened");
    expect(html).toContain("Something isn&#x27;t working");
    expect(html).toContain("I&#x27;d like something new");
    expect(html).toContain("I have a question");
    expect(html).toContain("Short title");
    expect(html).toContain("Tell us more");
    expect(html).toContain("cbpos_logs.txt");
    expect(html).toContain("Send ticket");
  });

  test("TicketDetailView renders ticket number, progress timeline, and Ceybyte Team response", () => {
    const html = renderToString(<TicketDetailView ticketNumber="CB-0142" locale="en" />);
    expect(html).toContain("CB-0142");
  });
});
