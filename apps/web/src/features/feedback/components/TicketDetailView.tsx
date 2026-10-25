"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Lightbulb, CheckCircle2, Calendar, Layers, Monitor, ExternalLink, Loader2 } from "lucide-react";
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
    if (!ticketNumber || ticketNumber === "ticket") return;
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
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 py-20 text-zinc-500">
        <Loader2 className="text-azure-400 h-6 w-6 animate-spin" />
        <span className="text-xs">Loading ticket {ticketNumber}...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="mb-2 text-xl font-bold text-zinc-100">Ticket Not Found</h2>
        <p className="mb-6 text-sm text-zinc-400">{error || "This ticket does not exist."}</p>
        <Link
          href={`/${locale}/feedback`}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
        >
          Return to Feedback Board
        </Link>
      </div>
    );
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(ticket.status as (typeof TIMELINE_STEPS)[number]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/feedback`}
        className="mb-6 inline-block text-xs text-zinc-500 hover:text-zinc-300"
      >
        ← Back to feedback board
      </Link>

      {/* Main card */}
      <div className="space-y-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm sm:p-8">
        {/* Top Header Row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-azure-400 font-mono text-sm font-bold">{ticket.formattedNumber}</span>
              <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">
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
              {ticket.severity && (
                <span className="rounded border border-rose-800/40 bg-rose-950/80 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-3 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            Progress Timeline
          </div>
          <div className="relative grid grid-cols-5 gap-2">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                      isCurrent
                        ? "bg-azure-500 border-azure-400 text-white shadow-sm"
                        : isPassed
                          ? "border-azure-500/60 text-azure-400 bg-zinc-800"
                          : "border-zinc-800 bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] capitalize ${
                      isCurrent
                        ? "text-azure-400 font-semibold"
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
            <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-zinc-800 pt-3 text-center text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resolved and shipped in CB POS v{ticket.releaseVersion}</span>
              <Link
                href={`/${locale}/releases`}
                className="ml-1 inline-flex items-center gap-0.5 text-emerald-300 underline hover:text-emerald-200"
              >
                <span>View Release Notes</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Environment metadata pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          {ticket.appVersion && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-500" />
              <span>App: v{ticket.appVersion}</span>
            </div>
          )}
          {ticket.windowsVersion && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
              <Monitor className="h-3.5 w-3.5 text-zinc-500" />
              <span>{ticket.windowsVersion}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span>Reported {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description body */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Description</h2>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">
            {ticket.bodyMd}
          </div>
        </div>

        {/* Approved public screenshot (if any) */}
        {ticket.screenshotPublicKey && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Screenshot</h2>
            <div className="max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://cdn.ceybyte.com/${ticket.screenshotPublicKey}`}
                alt="Ticket screenshot"
                className="h-auto w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Official Team Response (if any) */}
        {ticket.adminResponseMd && (
          <div className="border-l-azure-500 space-y-2 rounded-xl border border-l-2 border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
              <div className="text-azure-400 flex items-center gap-1.5 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ceybyte Team</span>
              </div>
              {ticket.adminRespondedAt && (
                <span className="text-[11px] text-zinc-500">
                  {new Date(ticket.adminRespondedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-300">
              {ticket.adminResponseMd}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
