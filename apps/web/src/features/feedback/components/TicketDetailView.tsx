"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bug,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Layers,
  Monitor,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { PublicFeedbackTicket } from "../types";
import { fetchTicket } from "../api";
import { VoteButton } from "./VoteButton";

interface TicketDetailViewProps {
  ticketNumber: string;
  locale: string;
}

const TIMELINE_STEPS = ["open", "triaged", "planned", "in_progress", "shipped"] as const;

export function TicketDetailView({ ticketNumber, locale }: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<PublicFeedbackTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTicket(ticketNumber);
        setTicket(data);
      } catch {
        setError(`Ticket ${ticketNumber} could not be found or is not public.`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-azure-400" />
        <span className="text-xs">Loading ticket {ticketNumber}...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Ticket Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">{error || "This ticket does not exist."}</p>
        <Link
          href={`/${locale}/feedback`}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800"
        >
          Return to Feedback Board
        </Link>
      </div>
    );
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(
    ticket.status as (typeof TIMELINE_STEPS)[number],
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/feedback`}
        className="text-xs text-zinc-500 hover:text-zinc-300 mb-6 inline-block"
      >
        ← Back to feedback board
      </Link>

      {/* Main card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm p-6 sm:p-8 space-y-8">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-azure-400">
                {ticket.formattedNumber}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 uppercase tracking-wider">
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
              {ticket.severity && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/40">
                  {ticket.severity.replace("_", " ")}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{ticket.title}</h1>
          </div>

          <div className="flex-shrink-0">
            <VoteButton
              ticketNumber={ticket.formattedNumber}
              initialVotes={ticket.voteCount}
              hasVoted={ticket.hasVoted}
            />
          </div>
        </div>

        {/* Status Timeline */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Progress Timeline
          </div>
          <div className="grid grid-cols-5 gap-2 relative">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors mb-1.5 ${
                      isCurrent
                        ? "bg-azure-500 border-azure-400 text-white shadow-sm"
                        : isPassed
                          ? "bg-zinc-800 border-azure-500/60 text-azure-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-600"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] capitalize ${
                      isCurrent
                        ? "font-semibold text-azure-400"
                        : isPassed
                          ? "text-zinc-300"
                          : "text-zinc-600"
                    }`}
                  >
                    {step.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>

          {ticket.status === "shipped" && ticket.releaseVersion && (
            <div className="mt-4 pt-3 border-t border-zinc-800 text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolved and shipped in CB POS v{ticket.releaseVersion}</span>
              <Link
                href={`/${locale}/releases`}
                className="underline inline-flex items-center gap-0.5 ml-1 text-emerald-300 hover:text-emerald-200"
              >
                <span>View Release Notes</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Environment metadata pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          {ticket.appVersion && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>App: v{ticket.appVersion}</span>
            </div>
          )}
          {ticket.windowsVersion && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <Monitor className="w-3.5 h-3.5 text-zinc-500" />
              <span>{ticket.windowsVersion}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Reported {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description body */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Description
          </h2>
          <div className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
            {ticket.bodyMd}
          </div>
        </div>

        {/* Approved public screenshot (if any) */}
        {ticket.screenshotPublicKey && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Screenshot
            </h2>
            <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden max-w-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://cdn.ceybyte.com/${ticket.screenshotPublicKey}`}
                alt="Ticket screenshot"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Official Team Response (if any) */}
        {ticket.adminResponseMd && (
          <div className="p-5 bg-zinc-950 border-l-2 border-l-azure-500 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-azure-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ceybyte Team</span>
              </div>
              {ticket.adminRespondedAt && (
                <span className="text-[11px] text-zinc-500">
                  {new Date(ticket.adminRespondedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {ticket.adminResponseMd}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
