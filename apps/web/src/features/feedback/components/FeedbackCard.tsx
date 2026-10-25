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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {ticket.releaseVersion
              ? `Fixed in v${ticket.releaseVersion}`
              : "Shipped"}
          </span>
        );
      case "planned":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Planned
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            In progress
          </span>
        );
      case "triaged":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Triaged
          </span>
        );
      case "closed":
      case "duplicate":
      case "wont_fix":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            {ticket.status.replace("_", " ")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
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
    <div className="flex items-center gap-4 p-4 hover:bg-zinc-900/60 transition-colors border-b border-zinc-800/80 last:border-b-0">
      <VoteButton
        ticketNumber={ticket.formattedNumber}
        initialVotes={ticket.voteCount}
        hasVoted={ticket.hasVoted}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/${locale}/feedback/${ticket.formattedNumber}`}
            className="font-mono text-xs font-bold text-zinc-400 hover:text-azure-400 transition-colors"
          >
            {ticket.formattedNumber}
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 uppercase tracking-wider">
            {ticket.type === "bug" ? (
              <>
                <Bug className="w-3 h-3 text-rose-400" />
                <span>Bug</span>
              </>
            ) : (
              <>
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Feature</span>
              </>
            )}
          </span>
          {ticket.adminResponseMd && (
            <span className="inline-flex items-center gap-1 text-[11px] text-azure-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Official response</span>
            </span>
          )}
        </div>

        <Link
          href={`/${locale}/feedback/${ticket.formattedNumber}`}
          className="block text-sm font-semibold text-zinc-100 hover:text-azure-400 transition-colors truncate"
        >
          {ticket.title}
        </Link>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {getStatusBadge()}
        <span className="text-[11px] text-zinc-500">{formattedDate}</span>
      </div>
    </div>
  );
}
