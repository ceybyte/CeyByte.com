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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {ticket.releaseVersion ? `Fixed in v${ticket.releaseVersion}` : "Shipped"}
          </span>
        );
      case "planned":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/60 bg-amber-950/80 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Planned
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-800/60 bg-indigo-950/80 px-2.5 py-1 text-xs font-semibold text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
            In progress
          </span>
        );
      case "triaged":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800/60 bg-blue-950/80 px-2.5 py-1 text-xs font-semibold text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Triaged
          </span>
        );
      case "closed":
      case "duplicate":
      case "wont_fix":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
            {ticket.status.replace("_", " ")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-800/60 bg-sky-950/80 px-2.5 py-1 text-xs font-semibold text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
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
    <div className="flex items-center gap-4 border-b border-zinc-800/80 p-4 transition-colors last:border-b-0 hover:bg-zinc-900/60">
      <VoteButton
        ticketNumber={ticket.formattedNumber}
        initialVotes={ticket.voteCount}
        hasVoted={ticket.hasVoted}
      />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Link
            href={`/${locale}/feedback/${ticket.formattedNumber}`}
            className="hover:text-azure-400 font-mono text-xs font-bold text-zinc-400 transition-colors"
          >
            {ticket.formattedNumber}
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] tracking-wider text-zinc-500 uppercase">
            {ticket.type === "bug" ? (
              <>
                <Bug className="h-3 w-3 text-rose-400" />
                <span>Bug</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3 text-amber-400" />
                <span>Feature</span>
              </>
            )}
          </span>
          {ticket.adminResponseMd && (
            <span className="text-azure-400 inline-flex items-center gap-1 text-[11px] font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>Official response</span>
            </span>
          )}
        </div>

        <Link
          href={`/${locale}/feedback/${ticket.formattedNumber}`}
          className="hover:text-azure-400 block truncate text-sm font-semibold text-zinc-100 transition-colors"
        >
          {ticket.title}
        </Link>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        {getStatusBadge()}
        <span className="text-[11px] text-zinc-500">{formattedDate}</span>
      </div>
    </div>
  );
}
