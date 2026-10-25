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
      className={`flex flex-col items-center justify-center min-w-[48px] px-2 py-2 rounded-lg border transition-all ${
        voted
          ? "bg-azure-950/60 border-azure-500/80 text-azure-400"
          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
      } ${className}`}
    >
      <ChevronUp
        className={`w-4 h-4 transition-transform ${voted ? "text-azure-400" : "group-hover:-translate-y-0.5"}`}
      />
      <span className="font-mono text-xs font-semibold mt-0.5">{votes}</span>
    </button>
  );
}
