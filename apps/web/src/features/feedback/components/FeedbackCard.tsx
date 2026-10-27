"use client";

import Link from "next/link";
import { Bug, Lightbulb, CheckCircle2 } from "lucide-react";
import { PublicFeedbackTicket } from "../types";
import { VoteButton } from "./VoteButton";

interface FeedbackCardProps {
  ticket: PublicFeedbackTicket;
  locale: string;
}

export function FeedbackCard({ ticket, locale }: FeedbackCardProps) {
  const getStatusBadge = () => {
    switch (ticket.status) {
      case "shipped":
        return (
          <span className="text-2xs inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {ticket.releaseVersion ? `Fixed in v${ticket.releaseVersion}` : "Shipped"}
          </span>
        );
      case "planned":
        return (
          <span className="text-2xs inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Planned
          </span>
        );
      case "in_progress":
        return (
          <span className="text-2xs inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-semibold text-indigo-600 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            In progress
          </span>
        );
      case "triaged":
        return (
          <span className="text-2xs inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Triaged
          </span>
        );
      case "closed":
      case "duplicate":
      case "wont_fix":
        return (
          <span className="border-hairline bg-surface-elevated text-2xs text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold">
            <span className="bg-muted h-1.5 w-1.5 rounded-full"></span>
            {ticket.status.replace("_", " ")}
          </span>
        );
      default:
        return (
          <span className="text-2xs inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-semibold text-sky-600 dark:text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
            Open
          </span>
        );
    }
  };

  const formattedDate = new Date(ticket.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="border-hairline hover:bg-surface-elevated/60 flex items-center gap-4 border-b p-4 transition-colors last:border-b-0">
      <VoteButton
        ticketNumber={ticket.formattedNumber}
        initialVotes={ticket.voteCount}
        hasVoted={ticket.hasVoted}
      />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Link
            href={`/${locale}/feedback/${ticket.formattedNumber}`}
            className="text-muted hover:text-azure-text font-mono text-xs font-bold transition-colors"
          >
            {ticket.formattedNumber}
          </Link>
          <span className="text-2xs text-muted inline-flex items-center gap-1 tracking-wider uppercase">
            {ticket.type === "bug" ? (
              <>
                <Bug className="h-3 w-3 text-rose-500" />
                <span>Bug</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3 text-amber-500" />
                <span>Feature</span>
              </>
            )}
          </span>
          {ticket.adminResponseMd && (
            <span className="text-2xs text-azure-text inline-flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>Official response</span>
            </span>
          )}
        </div>

        <Link
          href={`/${locale}/feedback/${ticket.formattedNumber}`}
          className="text-text hover:text-azure-text block truncate text-sm font-semibold transition-colors"
        >
          {ticket.title}
        </Link>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        {getStatusBadge()}
        <span className="text-2xs text-muted">{formattedDate}</span>
      </div>
    </div>
  );
}
