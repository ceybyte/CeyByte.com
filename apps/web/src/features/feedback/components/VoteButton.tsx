"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { voteTicket } from "../api";

interface VoteButtonProps {
  ticketNumber: string;
  initialVotes: number;
  hasVoted?: boolean;
  onVoteChange?: (newCount: number) => void;
  className?: string;
}

export function VoteButton({
  ticketNumber,
  initialVotes,
  hasVoted = false,
  onVoteChange,
  className = "",
}: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(hasVoted);
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await voteTicket(ticketNumber);
      setVotes(res.voteCount);
      if (res.voted || res.alreadyVoted) {
        setVoted(true);
      }
      onVoteChange?.(res.voteCount);
    } catch {
      // Keep state intact on error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={submitting}
      aria-label={`Vote for ticket ${ticketNumber}. Current votes: ${votes}`}
      className={`flex min-w-[48px] flex-col items-center justify-center rounded-xl border px-2 py-2 transition-all ${
        voted
          ? "border-azure/40 bg-azure/10 text-azure-text font-semibold shadow-xs"
          : "border-hairline bg-surface/80 text-muted hover:border-hairline hover:text-text hover:bg-surface-elevated"
      } ${className}`}
    >
      <ChevronUp
        className={`h-4 w-4 transition-transform ${voted ? "text-azure-text" : "group-hover:-translate-y-0.5"}`}
      />
      <span className="mt-0.5 font-mono text-xs font-semibold">{votes}</span>
    </button>
  );
}
